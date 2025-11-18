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
import { Plus, Pencil, Trash2, Camera, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  date: string;
  notes: string | null;
}

const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Housing",
  "Utilities",
  "Healthcare",
  "Entertainment",
  "Shopping",
  "Education",
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
  const [customCategory, setCustomCategory] = useState("");
  const [scanningReceipt, setScanningReceipt] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

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

    // Validate custom category if "Other" is selected
    if (formData.category === "Other" && !customCategory.trim()) {
      toast.error("Please specify the expense category");
      return;
    }

    const finalCategory = formData.category === "Other" ? customCategory.trim() : formData.category;

    try {
      if (editingId) {
        const { error } = await supabase
          .from("expenses")
          .update({
            category: finalCategory,
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
          category: finalCategory,
          amount: parseFloat(formData.amount),
          date: formData.date,
          notes: formData.notes || null,
        });
        
        if (error) throw error;
        toast.success("Expense added successfully");
      }
      
      setFormData({ category: "", amount: "", date: format(new Date(), "yyyy-MM-dd"), notes: "" });
      setCustomCategory("");
      setShowForm(false);
      setEditingId(null);
      await fetchExpenses();
    } catch (error: any) {
      toast.error(error.message || "Failed to save expense");
    }
  };

  const handleEdit = (item: ExpenseItem) => {
    // Check if category is a custom one (not in predefined list)
    const isCustomCategory = !CATEGORIES.includes(item.category);
    setFormData({
      category: isCustomCategory ? "Other" : item.category,
      amount: item.amount.toString(),
      date: item.date,
      notes: item.notes || "",
    });
    setCustomCategory(isCustomCategory ? item.category : "");
    setEditingId(item.id);
    setShowForm(true);
    setReceiptPreview(null);
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

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setScanningReceipt(true);
    
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        setReceiptPreview(base64Image);

        try {
          const { data, error } = await supabase.functions.invoke('scan-receipt', {
            body: { imageData: base64Image }
          });

          if (error) {
            console.error('Receipt scan error:', error);
            toast.error(error.message || "Failed to scan receipt");
            setScanningReceipt(false);
            return;
          }

          if (data) {
            // Check if category is custom (not in predefined list)
            const scannedCategory = data.category || "";
            const isCustom = scannedCategory && !CATEGORIES.includes(scannedCategory);
            
            // Auto-fill form with extracted data
            setFormData({
              ...formData,
              amount: data.amount?.toString() || "",
              category: isCustom ? "Other" : scannedCategory,
              notes: data.notes || ""
            });
            
            // Set custom category if needed
            if (isCustom) {
              setCustomCategory(scannedCategory);
            }
            
            const confidenceMsg = data.confidence === 'high' 
              ? '✓ High confidence' 
              : data.confidence === 'medium' 
              ? '~ Medium confidence - please verify' 
              : '⚠ Low confidence - please check values';
            
            toast.success(`Receipt scanned! ${confidenceMsg}`);
          }
          setScanningReceipt(false);
        } catch (err: any) {
          console.error('Scan error:', err);
          toast.error("Failed to process receipt");
          setScanningReceipt(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('File read error:', error);
      toast.error("Failed to read image file");
      setScanningReceipt(false);
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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Expenses</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Track your spending</p>
          </div>
          <Button 
            onClick={() => { 
              setShowForm(!showForm); 
              setEditingId(null); 
              setCustomCategory("");
              setFormData({ category: "", amount: "", date: format(new Date(), "yyyy-MM-dd"), notes: "" }); 
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle>{editingId ? "Edit Expense" : "Add New Expense"}</CardTitle>
              <CardDescription>
                Manually enter details or scan a receipt to auto-fill
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingId && (
                  <div className="space-y-2">
                    <Label htmlFor="receipt-upload" className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Scan Receipt (Optional)
                    </Label>
                    <div className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          id="receipt-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleReceiptUpload}
                          disabled={scanningReceipt}
                          className="cursor-pointer"
                        />
                      </div>
                      {scanningReceipt && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Scanning...
                        </div>
                      )}
                    </div>
                    {receiptPreview && (
                      <div className="mt-2">
                        <img 
                          src={receiptPreview} 
                          alt="Receipt preview" 
                          className="max-h-40 rounded border border-border"
                        />
                      </div>
                    )}
                    <Alert>
                      <AlertDescription className="text-xs">
                        💡 Upload a clear photo of your receipt for automatic data extraction
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => {
                        setFormData({ ...formData, category: value });
                        if (value !== "Other") {
                          setCustomCategory("");
                        }
                      }}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.category === "Other" && (
                    <div className="space-y-2">
                      <Label htmlFor="customCategory">Specify Category</Label>
                      <Input
                        id="customCategory"
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="E.g., Pet Supplies, Insurance, etc."
                        maxLength={50}
                        required
                      />
                    </div>
                  )}
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
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:gap-0">
                  <Button type="submit" className="w-full sm:w-auto">
                    {editingId ? "Update" : "Add"} Expense
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { 
                    setShowForm(false); 
                    setEditingId(null); 
                    setCustomCategory("");
                  }} className="w-full sm:w-auto">
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
                <CardContent className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-3 sm:gap-0">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 gap-2 mb-1">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium inline-block w-fit">
                        {item.category}
                      </span>
                      <p className="text-xl sm:text-2xl font-bold text-destructive">{formatAmount(item.amount)}</p>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{format(new Date(item.date), "MMM dd, yyyy")}</p>
                    {item.notes && <p className="text-sm mt-1">{item.notes}</p>}
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

export default Expenses;