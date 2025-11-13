import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

const Advisor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string>("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkUser();
  }, [navigate]);

  const getAdvice = async () => {
    setLoading(true);
    try {
      // Get user's currency preference
      const currencyData = localStorage.getItem('preferredCurrency');
      let currency = { code: 'USD', symbol: '$', name: 'US Dollar' };
      if (currencyData) {
        try {
          currency = JSON.parse(currencyData);
        } catch (e) {
          console.error('Failed to parse currency data');
        }
      }

      const { data, error } = await supabase.functions.invoke("budget-advisor", {
        body: { currency }
      });
      
      if (error) throw error;
      
      if (data?.advice) {
        setAdvice(data.advice);
      } else {
        toast.error("No advice received");
      }
    } catch (error: any) {
      console.error("Advisor error:", error);
      toast.error(error.message || "Failed to get advice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Budget Advisor</h1>
          <p className="text-muted-foreground">Get personalized financial guidance</p>
        </div>

        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Your Personal Financial Assistant</span>
            </CardTitle>
            <CardDescription>
              Click the button below to receive AI-powered budgeting advice based on your income and expenses.
              Our advisor will help you identify spending patterns, suggest savings strategies, and provide
              actionable tips for managing your finances effectively.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={getAdvice} 
              disabled={loading}
              size="lg"
              className="w-full md:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Your Finances...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get Budget Advice
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {advice && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary">Your Personalized Advice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {advice}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!advice && (
          <Card className="shadow-md bg-muted/50">
            <CardContent className="py-12 text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No advice yet</h3>
              <p className="text-muted-foreground">
                Click "Get Budget Advice" to receive personalized recommendations
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Advisor;