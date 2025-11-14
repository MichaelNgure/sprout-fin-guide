import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Plus, Target, TrendingUp, AlertTriangle, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BudgetGoal {
  id: string;
  category: string;
  target_amount: number;
  period: string;
  start_date: string;
  created_at: string;
}

interface GoalProgress {
  goal: BudgetGoal;
  currentSpending: number;
  percentage: number;
  status: 'safe' | 'warning' | 'danger' | 'exceeded';
}

const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Utilities",
  "Healthcare",
  "Entertainment",
  "Shopping",
  "Housing",
  "Education",
  "Other",
];

const BudgetGoals = () => {
  const navigate = useNavigate();
  const { formatAmount, currency } = useCurrency();
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    target_amount: "",
    period: "monthly",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    fetchGoalsWithProgress();
  };

  const fetchGoalsWithProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from("budget_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (goalsError) throw goalsError;

      if (!goalsData || goalsData.length === 0) {
        setGoals([]);
        setLoading(false);
        return;
      }

      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id);

      if (expensesError) throw expensesError;

      // Calculate progress for each goal
      const goalsWithProgress: GoalProgress[] = goalsData.map((goal) => {
        const startDate = new Date(goal.start_date);
        const now = new Date();
        
        // Calculate period end date
        let periodEndDate = new Date(startDate);
        if (goal.period === 'weekly') {
          periodEndDate.setDate(startDate.getDate() + 7);
        } else {
          periodEndDate.setMonth(startDate.getMonth() + 1);
        }

        // Filter expenses for this category and period
        const relevantExpenses = (expensesData || []).filter((expense) => {
          const expenseDate = new Date(expense.date);
          return (
            expense.category === goal.category &&
            expenseDate >= startDate &&
            expenseDate <= periodEndDate
          );
        });

        const currentSpending = relevantExpenses.reduce(
          (sum, expense) => sum + Number(expense.amount),
          0
        );

        const percentage = Math.min((currentSpending / Number(goal.target_amount)) * 100, 100);
        
        let status: 'safe' | 'warning' | 'danger' | 'exceeded' = 'safe';
        if (percentage >= 100) status = 'exceeded';
        else if (percentage >= 90) status = 'danger';
        else if (percentage >= 80) status = 'warning';

        return {
          goal,
          currentSpending,
          percentage,
          status,
        };
      });

      setGoals(goalsWithProgress);
      
      // Show notifications for goals approaching or exceeding limits
      goalsWithProgress.forEach((goalProgress) => {
        if (goalProgress.status === 'exceeded') {
          toast.error(`Budget exceeded for ${goalProgress.goal.category}!`, {
            description: `You've spent ${formatAmount(goalProgress.currentSpending)} of ${formatAmount(Number(goalProgress.goal.target_amount))}`,
          });
        } else if (goalProgress.status === 'danger') {
          toast.warning(`Approaching limit for ${goalProgress.goal.category}`, {
            description: `You've spent ${Math.round(goalProgress.percentage)}% of your budget`,
          });
        }
      });
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error("Failed to load budget goals");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.target_amount) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { error } = await supabase.from("budget_goals").insert({
        user_id: user.id,
        category: formData.category,
        target_amount: parseFloat(formData.target_amount),
        period: formData.period,
        start_date: new Date().toISOString().split('T')[0],
      });

      if (error) throw error;

      toast.success("Budget goal created!");
      setFormData({ category: "", target_amount: "", period: "monthly" });
      setDialogOpen(false);
      fetchGoalsWithProgress();
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error("Failed to create budget goal");
    }
  };

  const handleDelete = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from("budget_goals")
        .delete()
        .eq("id", goalId);

      if (error) throw error;

      toast.success("Budget goal deleted");
      fetchGoalsWithProgress();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete budget goal");
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'bg-destructive';
      case 'danger': return 'bg-orange-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-primary';
    }
  };

  const getStatusAlert = (goalProgress: GoalProgress) => {
    const { status, percentage, currentSpending, goal } = goalProgress;
    
    if (status === 'exceeded') {
      return (
        <Alert className="border-destructive bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            Budget exceeded by {formatAmount(currentSpending - Number(goal.target_amount))}
          </AlertDescription>
        </Alert>
      );
    }
    
    if (status === 'danger') {
      return (
        <Alert className="border-orange-500 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-700 dark:text-orange-400">
            {Math.round(percentage)}% spent - approaching limit!
          </AlertDescription>
        </Alert>
      );
    }
    
    if (status === 'warning') {
      return (
        <Alert className="border-yellow-500 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-400">
            {Math.round(percentage)}% spent - watch your spending
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        <Navigation />
        <div className="flex items-center justify-center h-[50vh]">
          <p className="text-muted-foreground">Loading budget goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Budget Goals</h1>
            <p className="text-muted-foreground">Set and track your spending limits</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Budget Goal</DialogTitle>
                <DialogDescription>
                  Set a spending limit for a category
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_amount">Target Amount ({currency.symbol})</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    step="0.01"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">Period</Label>
                  <Select
                    value={formData.period}
                    onValueChange={(value) => setFormData({ ...formData, period: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full">
                  Create Goal
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {goals.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No budget goals yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first budget goal to start tracking your spending
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {goals.map((goalProgress) => (
              <Card key={goalProgress.goal.id} className="shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{goalProgress.goal.category}</CardTitle>
                        <CardDescription className="capitalize">
                          {goalProgress.goal.period} budget
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(goalProgress.goal.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getStatusAlert(goalProgress)}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">
                        {Math.round(goalProgress.percentage)}%
                      </span>
                    </div>
                    <Progress 
                      value={goalProgress.percentage} 
                      className="h-3"
                      indicatorClassName={getProgressColor(goalProgress.status)}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div>
                      <p className="text-sm text-muted-foreground">Spent</p>
                      <p className="text-lg font-bold">
                        {formatAmount(goalProgress.currentSpending)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Target</p>
                      <p className="text-lg font-bold">
                        {formatAmount(Number(goalProgress.goal.target_amount))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>
                      {formatAmount(Number(goalProgress.goal.target_amount) - goalProgress.currentSpending)} remaining
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetGoals;
