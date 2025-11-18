import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";

interface IncomeItem {
  id: string;
  amount: number;
  date: string;
  description: string | null;
}

const Income = () => {
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState<IncomeItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      await fetchIncome();
    };
    checkUser();
  }, [navigate]);

  const fetchIncome = async () => {
    try {
      const { data, error } = await supabase
        .from("income")
        .select("*")
        .order("date", { ascending: false });
      
      if (error) throw error;
      if (data) setIncome(data);
    } catch (error: any) {
      toast.error("Failed to fetch income");
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
          .from("income")
          .update({
            amount: parseFloat(formData.amount),
            date: formData.date,
            description: formData.description || null,
          })
          .eq("id", editingId);
        
        if (error) throw error;
        toast.success("Income updated successfully");
      } else {
        const { error } = await supabase.from("income").insert({
          user_id: user.id,
          amount: parseFloat(formData.amount),
          date: formData.date,
          description: formData.description || null,
        });
        
        if (error) throw error;
        toast.success("Income added successfully");
      }
      
      setFormData({ amount: "", date: format(new Date(), "yyyy-MM-dd"), description: "" });
      setShowForm(false);
      setEditingId(null);
      await fetchIncome();
    } catch (error: any) {
      toast.error(error.message || "Failed to save income");
    }
  };

  const handleEdit = (item: IncomeItem) => {
    setFormData({
      amount: item.amount.toString(),
      date: item.date,
      description: item.description || "",
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("income").delete().eq("id", id);
      if (error) throw error;
      toast.success("Income deleted successfully");
      await fetchIncome();
    } catch (error: any) {
      toast.error("Failed to delete income");
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Income</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Track your income sources</p>
          </div>
          <Button 
            onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ amount: "", date: format(new Date(), "yyyy-MM-dd"), description: "" }); }}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Income
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle>{editingId ? "Edit Income" : "Add New Income"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="E.g., Salary, Freelance work, etc."
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:gap-0">
                  <Button type="submit" className="w-full sm:w-auto">
                    {editingId ? "Update" : "Add"} Income
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {income.length === 0 ? (
            <Card className="shadow-md">
              <CardContent className="py-12 text-center text-muted-foreground">
                No income recorded yet. Click "Add Income" to get started.
              </CardContent>
            </Card>
          ) : (
            income.map((item) => (
              <Card key={item.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-3 sm:gap-0">
                  <div className="flex-1">
                    <p className="text-xl sm:text-2xl font-bold text-success">{formatAmount(item.amount)}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{format(new Date(item.date), "MMM dd, yyyy")}</p>
                    {item.description && <p className="text-sm mt-1">{item.description}</p>}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="flex-1 sm:flex-none">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-destructive hover:text-destructive flex-1 sm:flex-none">
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

export default Income;