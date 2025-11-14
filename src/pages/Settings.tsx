import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCurrency, CURRENCIES } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import { DollarSign, Check, MapPin } from "lucide-react";

const Settings = () => {
  const { currency, setCurrency } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState(currency.code);
  const [autoDetect, setAutoDetect] = useState(() => {
    const saved = localStorage.getItem('autoDetectCurrency');
    return saved === null || saved === 'true';
  });

  const handleCurrencyChange = (currencyCode: string) => {
    const newCurrency = CURRENCIES.find(c => c.code === currencyCode);
    if (newCurrency) {
      setCurrency(newCurrency);
      setSelectedCurrency(currencyCode);
      toast.success(`Currency updated to ${newCurrency.name}`);
    }
  };

  const handleAutoDetectToggle = (enabled: boolean) => {
    setAutoDetect(enabled);
    localStorage.setItem('autoDetectCurrency', String(enabled));
    toast.success(`Auto-detect currency ${enabled ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences</p>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Currency Preference</CardTitle>
                <CardDescription>Select your preferred currency for the app</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="auto-detect" className="text-base font-medium">Auto-detect Currency</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically set currency based on your location
                  </p>
                </div>
              </div>
              <Switch
                id="auto-detect"
                checked={autoDetect}
                onCheckedChange={handleAutoDetectToggle}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger id="currency" className="w-full bg-background">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {CURRENCIES.map((curr) => (
                    <SelectItem 
                      key={curr.code} 
                      value={curr.code}
                      className="cursor-pointer hover:bg-accent focus:bg-accent"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{curr.symbol} - {curr.name} ({curr.code})</span>
                        {curr.code === selectedCurrency && (
                          <Check className="h-4 w-4 text-primary ml-2" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <h3 className="font-medium text-foreground mb-2">Preview</h3>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Your amounts will be displayed as: <span className="font-bold text-foreground">{currency.symbol}1,234.56</span>
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                💡 Note: This only changes how amounts are displayed. It doesn't convert existing values.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
