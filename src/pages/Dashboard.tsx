import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Income {
  id: string;
  amount: number;
  date: string;
  description?: string | null;
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  notes?: string | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dateRange, setDateRange] = useState<string>("all");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      await fetchData();
    };
    checkUser();
  }, [navigate, dateRange]);

  const fetchData = async () => {
    try {
      let incomeQuery = supabase.from("income").select("*");
      let expensesQuery = supabase.from("expenses").select("*");

      // Apply date filters
      if (dateRange !== "all") {
        const now = new Date();
        let startDate: Date;
        
        switch (dateRange) {
          case "1m":
            startDate = subMonths(now, 1);
            break;
          case "3m":
            startDate = subMonths(now, 3);
            break;
          case "6m":
            startDate = subMonths(now, 6);
            break;
          case "1y":
            startDate = subMonths(now, 12);
            break;
          default:
            startDate = new Date(0);
        }
        
        incomeQuery = incomeQuery.gte("date", startDate.toISOString().split('T')[0]);
        expensesQuery = expensesQuery.gte("date", startDate.toISOString().split('T')[0]);
      }

      const [incomeRes, expensesRes] = await Promise.all([
        incomeQuery.order("date", { ascending: false }),
        expensesQuery.order("date", { ascending: false }),
      ]);

      if (incomeRes.data) setIncome(incomeRes.data);
      if (expensesRes.data) setExpenses(expensesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = income.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

  // Category breakdown
  const categoryData = expenses.reduce((acc, expense) => {
    const existing = acc.find(item => item.category === expense.category);
    if (existing) {
      existing.amount += Number(expense.amount);
    } else {
      acc.push({ category: expense.category, amount: Number(expense.amount) });
    }
    return acc;
  }, [] as { category: string; amount: number }[]).sort((a, b) => b.amount - a.amount);

  // Income vs Expenses over time
  const timeSeriesData = [...income, ...expenses].reduce((acc, item) => {
    const month = format(parseISO(item.date), "MMM yyyy");
    const existing = acc.find(d => d.month === month);
    const amount = Number(item.amount);
    
    if (existing) {
      if ('category' in item) {
        existing.expenses += amount;
      } else {
        existing.income += amount;
      }
    } else {
      acc.push({
        month,
        income: 'category' in item ? 0 : amount,
        expenses: 'category' in item ? amount : 0,
      });
    }
    return acc;
  }, [] as { month: string; income: number; expenses: number }[])
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    .slice(-6);

  // Recent transactions
  const recentTransactions = [
    ...income.slice(0, 5).map(i => ({ ...i, type: 'income' as const })),
    ...expenses.slice(0, 5).map(e => ({ ...e, type: 'expense' as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const chartConfig = {
    income: {
      label: "Income",
      color: "hsl(var(--success))",
    },
    expenses: {
      label: "Expenses",
      color: "hsl(var(--destructive))",
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Overview of your financial health</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="1m">Last Month</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatAmount(totalIncome)}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                {dateRange === "all" ? "All time" : `Last ${dateRange === "1m" ? "month" : dateRange === "3m" ? "3 months" : dateRange === "6m" ? "6 months" : "year"}`}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatAmount(totalExpenses)}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                {dateRange === "all" ? "All time" : `Last ${dateRange === "1m" ? "month" : dateRange === "3m" ? "3 months" : dateRange === "6m" ? "6 months" : "year"}`}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
              <div className={`h-8 w-8 rounded-full ${balance >= 0 ? 'bg-primary/10' : 'bg-warning/10'} flex items-center justify-center`}>
                <Wallet className={`h-4 w-4 ${balance >= 0 ? 'text-primary' : 'text-warning'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatAmount(balance)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Current balance</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
              <div className={`h-8 w-8 rounded-full ${savingsRate >= 20 ? 'bg-success/10' : savingsRate >= 10 ? 'bg-warning/10' : 'bg-destructive/10'} flex items-center justify-center`}>
                <TrendingUp className={`h-4 w-4 ${savingsRate >= 20 ? 'text-success' : savingsRate >= 10 ? 'text-warning' : 'text-destructive'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${savingsRate >= 20 ? 'text-success' : savingsRate >= 10 ? 'text-warning' : 'text-destructive'}`}>
                {savingsRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Of income saved</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Income vs Expenses</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Track your cash flow over time</CardDescription>
            </CardHeader>
            <CardContent>
              {timeSeriesData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px]">
                  <LineChart data={timeSeriesData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-sm sm:text-base text-muted-foreground">
                  No data available for this period
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Spending by Category</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Top expense categories</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px]">
                  <BarChart data={categoryData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="category" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-sm sm:text-base text-muted-foreground">
                  No expense data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Recent Transactions</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Your latest income and expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-start sm:items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors gap-2">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full ${transaction.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'} flex items-center justify-center flex-shrink-0`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm sm:text-base truncate">
                          {transaction.type === 'income' 
                            ? ('description' in transaction && transaction.description) || 'Income'
                            : ('category' in transaction && transaction.category) || 'Expense'
                          }
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {format(parseISO(transaction.date), "MMM dd, yyyy")}
                          {'notes' in transaction && transaction.notes && ` • ${transaction.notes}`}
                        </p>
                      </div>
                    </div>
                    <div className={`text-sm sm:text-lg font-bold whitespace-nowrap flex-shrink-0 ${transaction.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatAmount(Number(transaction.amount))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm sm:text-base text-muted-foreground py-8">
                No transactions yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;