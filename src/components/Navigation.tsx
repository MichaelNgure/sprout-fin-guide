import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Home, DollarSign, CreditCard, Sparkles, LogOut, Wallet, Settings as SettingsIcon, Target, Menu, X, History } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Navigation = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  const navItems = [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/income", icon: DollarSign, label: "Income" },
    { to: "/expenses", icon: CreditCard, label: "Expenses" },
    { to: "/advisor", icon: Sparkles, label: "AI Advisor" },
    { to: "/saved-advice", icon: History, label: "Saved Advice" },
    { to: "/budget-goals", icon: Target, label: "Goals" },
    { to: "/settings", icon: SettingsIcon, label: "Settings" },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-base sm:text-lg font-bold text-foreground">Budget Buddy</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center space-x-2"
                activeClassName="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center space-x-2 ml-2">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="flex items-center lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <span className="text-lg font-bold text-foreground">Budget Buddy</span>
                    </div>
                  </div>
                  <div className="flex-1 py-4">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center space-x-3 px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        activeClassName="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                  <div className="p-4 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;