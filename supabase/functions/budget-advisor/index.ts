import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Fetch user's income and expenses
    const [incomeRes, expensesRes] = await Promise.all([
      supabase.from("income").select("*").eq("user_id", user.id),
      supabase.from("expenses").select("*").eq("user_id", user.id),
    ]);

    const income = incomeRes.data || [];
    const expenses = expensesRes.data || [];

    const totalIncome = income.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

    // Aggregate expenses by category
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    // Build prompt for AI
    const prompt = `You are a financial advisor helping low-income individuals manage their budgets. Analyze this financial data and provide clear, actionable advice:

Total Income: $${totalIncome.toFixed(2)}
Total Expenses: $${totalExpenses.toFixed(2)}
Balance: $${(totalIncome - totalExpenses).toFixed(2)}

Expenses by Category:
${Object.entries(categoryTotals)
  .map(([cat, amt]) => `- ${cat}: $${(amt as number).toFixed(2)}`)
  .join("\n")}

Please provide:
1. An assessment of their financial situation
2. Areas where they might be overspending
3. Realistic suggestions for reducing expenses
4. Tips for building savings, even with limited income
5. A simple monthly budget plan

Keep the advice simple, encouraging, and practical for someone with limited financial resources.`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a compassionate financial advisor specializing in helping low-income individuals manage their money effectively.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error("Failed to get AI advice");
    }

    const aiData = await aiResponse.json();
    const advice = aiData.choices?.[0]?.message?.content || "Unable to generate advice at this time.";

    return new Response(JSON.stringify({ advice }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in budget-advisor:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});