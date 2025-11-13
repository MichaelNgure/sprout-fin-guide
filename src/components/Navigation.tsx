import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Home, DollarSign, CreditCard, Sparkles, LogOut, Wallet, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";

const Navigation = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-2 mr-8">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">Budget Buddy</span>
            </div>
            <div className="flex space-x-1">
              <NavLink
                to="/dashboard"
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center space-x-2"
                activeClassName="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink
                to="/income"
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center space-x-2"
                activeClassName="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
              >
                <DollarSign className="w-4 h-4" />
                <span>Income</span>
              </NavLink>
              <NavLink
                to="/expenses"
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center space-x-2"
                activeClassName="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
              >
                <CreditCard className="w-4 h-4" />
                <span>Expenses</span>
              </NavLink>
              <NavLink
                to="/advisor"
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center space-x-2"
                activeClassName="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Advisor</span>
              </NavLink>
              <NavLink
                to="/settings"
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center space-x-2"
                activeClassName="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Settings</span>
              </NavLink>
            </div>
          </div>
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;