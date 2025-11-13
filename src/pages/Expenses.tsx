import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  date: string;
  notes: string | null;
}

const CATEGORIES = [
  "Housing",
  "Food",
  "Transportation",
  "Utilities",
  "Healthcare",
  "Education",
  "Entertainment",
  "Clothing",
  "Personal Care",
  "Other"
];

const Expenses = () => {
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      await fetchExpenses();
    };
    checkUser();
  }, [navigate]);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });
      
      if (error) throw error;
      if (data) setExpenses(data);
    } catch (error: any) {
      toast.error("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (editingId) {
        const { error } = await supabase
          .from("expenses")
          .update({
            category: formData.category,
            amount: parseFloat(formData.amount),
            date: formData.date,
            notes: formData.notes || null,
          })
          .eq("id", editingId);
        
        if (error) throw error;
        toast.success("Expense updated successfully");
      } else {
        const { error } = await supabase.from("expenses").insert({
          user_id: user.id,
          category: formData.category,
          amount: parseFloat(formData.amount),
          date: formData.date,
          notes: formData.notes || null,
        });
        
        if (error) throw error;
        toast.success("Expense added successfully");
      }
      
      setFormData({ category: "", amount: "", date: format(new Date(), "yyyy-MM-dd"), notes: "" });
      setShowForm(false);
      setEditingId(null);
      await fetchExpenses();
    } catch (error: any) {
      toast.error(error.message || "Failed to save expense");
    }
  };

  const handleEdit = (item: ExpenseItem) => {
    setFormData({
      category: item.category,
      amount: item.amount.toString(),
      date: item.date,
      notes: item.notes || "",
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Expense deleted successfully");
      await fetchExpenses();
    } catch (error: any) {
      toast.error("Failed to delete expense");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Expenses</h1>
            <p className="text-muted-foreground">Track your spending</p>
          </div>
          <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ category: "", amount: "", date: format(new Date(), "yyyy-MM-dd"), notes: "" }); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle>{editingId ? "Edit Expense" : "Add New Expense"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any additional details..."
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit">
                    {editingId ? "Update" : "Add"} Expense
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {expenses.length === 0 ? (
            <Card className="shadow-md">
              <CardContent className="py-12 text-center text-muted-foreground">
                No expenses recorded yet. Click "Add Expense" to get started.
              </CardContent>
            </Card>
          ) : (
            expenses.map((item) => (
              <Card key={item.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="flex justify-between items-center py-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                        {item.category}
                      </span>
                      <p className="text-2xl font-bold text-destructive">{formatAmount(item.amount)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{format(new Date(item.date), "MMM dd, yyyy")}</p>
                    {item.notes && <p className="text-sm mt-1">{item.notes}</p>}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Expenses;