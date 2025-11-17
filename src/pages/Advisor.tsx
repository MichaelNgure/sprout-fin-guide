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
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">AI Budget Advisor</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Get personalized financial guidance</p>
        </div>

        <Card className="shadow-lg mb-6 sm:mb-8">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span>Your Personal Financial Assistant</span>
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed mt-2">
              Get AI-powered budgeting advice based on your income and expenses.
              Identify spending patterns, savings strategies, and actionable financial tips.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button 
              onClick={getAdvice} 
              disabled={loading}
              size="lg"
              className="w-full sm:w-auto min-h-[44px] text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Analyzing Your Finances...</span>
                  <span className="sm:hidden">Analyzing...</span>
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
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-primary text-lg sm:text-xl">Your Personalized Advice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-foreground leading-relaxed text-sm sm:text-base">
                  {advice}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!advice && (
          <Card className="shadow-md bg-muted/50">
            <CardContent className="py-8 sm:py-12 text-center">
              <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No advice yet</h3>
              <p className="text-sm sm:text-base text-muted-foreground px-4">
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