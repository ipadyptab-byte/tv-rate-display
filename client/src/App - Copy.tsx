import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Navigation } from "@/components/navigation";
import TVDisplay from "@/pages/tv-display";
import MobileControl from "@/pages/mobile-control";
import AdminDashboard from "@/pages/admin-dashboard";
import MediaManager from "@/pages/media-manager";
import PromoManager from "@/pages/promo-manager";
import NotFound from "@/pages/not-found";
import SaleStatus from "@/pages/sale-status";

function Router() {
  return (
    <div className="min-h-screen bg-gold-50">
      <Navigation />
      <Switch>
        <Route path="/" component={TVDisplay} />
        <Route path="/mobile" component={MobileControl} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/media" component={MediaManager} />
        <Route path="/promo" component={PromoManager} />
        <Route path="/status" component={SaleStatus} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
