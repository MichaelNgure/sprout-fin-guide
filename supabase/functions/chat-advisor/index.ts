import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { messages, currency } = await req.json();

    // Fetch user's financial data
    const { data: incomeData } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', user.id);

    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id);

    const { data: goalsData } = await supabase
      .from('budget_goals')
      .select('*')
      .eq('user_id', user.id);

    // Calculate totals
    const totalIncome = incomeData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalExpenses = expensesData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

    // Group expenses by category
    const expensesByCategory: Record<string, number> = {};
    expensesData?.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + Number(expense.amount);
    });

    const currencySymbol = currency?.symbol || '$';
    const currencyCode = currency?.code || 'USD';

    // Build context for the AI
    const financialContext = `
Financial Summary:
- Total Income: ${currencySymbol}${totalIncome.toFixed(2)} ${currencyCode}
- Total Expenses: ${currencySymbol}${totalExpenses.toFixed(2)} ${currencyCode}
- Net Balance: ${currencySymbol}${(totalIncome - totalExpenses).toFixed(2)} ${currencyCode}

Expenses by Category:
${Object.entries(expensesByCategory).map(([cat, amt]) => `- ${cat}: ${currencySymbol}${amt.toFixed(2)}`).join('\n')}

Budget Goals:
${goalsData?.length ? goalsData.map(g => `- ${g.category}: Target ${currencySymbol}${g.target_amount} (${g.period})`).join('\n') : 'No budget goals set'}
`;

    const systemPrompt = `You are a helpful financial advisor assistant. You have access to the user's financial data and can provide personalized advice.

${financialContext}

Provide clear, actionable financial advice based on this data. Be conversational and helpful. Keep responses concise but informative.`;

    // Prepare messages with system context
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    console.log('Calling Lovable AI with messages:', aiMessages.length);

    // Call Lovable AI with streaming
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    // Return the streaming response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
      },
    });

  } catch (error: any) {
    console.error('Chat advisor error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
