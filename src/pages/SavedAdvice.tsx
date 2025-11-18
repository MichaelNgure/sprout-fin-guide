import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Trash2, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SavedAdvice {
  id: string;
  advice: string;
  created_at: string;
}

const SavedAdvice = () => {
  const navigate = useNavigate();
  const [adviceList, setAdviceList] = useState<SavedAdvice[]>([]);
  const [filteredAdvice, setFilteredAdvice] = useState<SavedAdvice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    fetchAdvice();
  }, []);

  useEffect(() => {
    filterByDate();
  }, [selectedDate, adviceList]);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("advice_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAdviceList(data || []);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast.error(error.message || "Failed to fetch saved advice");
    } finally {
      setLoading(false);
    }
  };

  const filterByDate = () => {
    if (!selectedDate) {
      setFilteredAdvice(adviceList);
      return;
    }

    const filtered = adviceList.filter((advice) => {
      const adviceDate = new Date(advice.created_at);
      return (
        adviceDate.getDate() === selectedDate.getDate() &&
        adviceDate.getMonth() === selectedDate.getMonth() &&
        adviceDate.getFullYear() === selectedDate.getFullYear()
      );
    });

    setFilteredAdvice(filtered);
  };

  const deleteAdvice = async (id: string) => {
    try {
      const { error } = await supabase
        .from("advice_history")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Advice deleted successfully");
      fetchAdvice();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete advice");
    }
  };

  const toggleCompareSelection = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((item) => item !== id));
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare([...selectedForCompare, id]);
    } else {
      toast.error("You can only compare 2 items at a time");
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(undefined);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <Navigation />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
            Saved Advice History
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View and compare your past AI recommendations
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Filter by date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          {selectedDate && (
            <Button variant="outline" onClick={clearDateFilter} className="w-full sm:w-auto">
              Clear Filter
            </Button>
          )}

          <Button
            variant={compareMode ? "default" : "outline"}
            onClick={() => {
              setCompareMode(!compareMode);
              setSelectedForCompare([]);
            }}
            className="w-full sm:w-auto sm:ml-auto"
          >
            {compareMode ? "Exit Compare Mode" : "Compare Advice"}
          </Button>
        </div>

        {compareMode && selectedForCompare.length > 0 && (
          <Alert className="mb-6 bg-primary/5 border-primary/20">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="ml-2">
              {selectedForCompare.length === 1
                ? "Select one more advice to compare"
                : "Comparing 2 advice items - scroll to see both side by side"}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filteredAdvice.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {selectedDate
                  ? "No saved advice found for this date"
                  : "No saved advice yet. Get some advice from the AI Advisor first!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div
            className={cn(
              "grid gap-4 sm:gap-6",
              compareMode && selectedForCompare.length === 2
                ? "grid-cols-1 lg:grid-cols-2"
                : "grid-cols-1"
            )}
          >
            {filteredAdvice
              .filter(
                (advice) =>
                  !compareMode ||
                  selectedForCompare.length === 0 ||
                  selectedForCompare.includes(advice.id)
              )
              .map((advice) => (
                <Card
                  key={advice.id}
                  className={cn(
                    "shadow-lg transition-all",
                    compareMode && "cursor-pointer hover:border-primary",
                    selectedForCompare.includes(advice.id) && "border-primary border-2"
                  )}
                  onClick={() => compareMode && toggleCompareSelection(advice.id)}
                >
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <CardTitle className="text-base sm:text-lg">
                          Advice from {format(new Date(advice.created_at), "PPP")}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm mt-1">
                          {format(new Date(advice.created_at), "p")}
                        </CardDescription>
                      </div>
                      {!compareMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAdvice(advice.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-lg sm:text-xl font-bold text-foreground mb-3 mt-4 first:mt-0">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2 mt-3">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2 mt-2">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="text-foreground/90 mb-2 leading-relaxed text-sm">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside space-y-1 mb-3 text-foreground/90 text-sm">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside space-y-1 mb-3 text-foreground/90 text-sm">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => <li className="ml-2">{children}</li>,
                          strong: ({ children }) => (
                            <strong className="font-semibold text-foreground">{children}</strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-foreground/80">{children}</em>
                          ),
                        }}
                      >
                        {advice.advice}
                      </ReactMarkdown>
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

export default SavedAdvice;
