import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Sparkles, Loader2, Save, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";

const Advisor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string>("");
  const [saving, setSaving] = useState(false);

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

  const saveAdvice = async () => {
    if (!advice) return;
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("advice_history")
        .insert({
          user_id: user.id,
          advice: advice,
        });

      if (error) throw error;

      toast.success("Advice saved successfully!");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save advice");
    } finally {
      setSaving(false);
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

        <Alert className="mb-6 sm:mb-8 bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm sm:text-base ml-2">
            <strong>How to use:</strong> First, add your income and expenses in their respective pages. 
            Then come back here and click "Get Budget Advice" to receive AI-powered financial recommendations 
            based on your spending patterns.
          </AlertDescription>
        </Alert>

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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-primary text-lg sm:text-xl">Your Personalized Advice</CardTitle>
                <Button 
                  onClick={saveAdvice} 
                  disabled={saving}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Advice
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-4 mt-6 first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 mt-4">{children}</h3>,
                    p: ({ children }) => <p className="text-foreground/90 mb-3 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4 text-foreground/90">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-4 text-foreground/90">{children}</ol>,
                    li: ({ children }) => <li className="ml-2">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
                  }}
                >
                  {advice}
                </ReactMarkdown>
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