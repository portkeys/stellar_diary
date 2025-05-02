import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import NotFound from "@/pages/not-found";
import StarryBackground from "@/components/StarryBackground";
import Home from "@/pages/Home";
import MonthlyGuide from "@/pages/MonthlyGuide";
import MyObservations from "@/pages/MyObservations";
import Learn from "@/pages/Learn";
import CollimationGuide from "@/pages/CollimationGuide";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/monthly-guide" component={MonthlyGuide} />
      <Route path="/my-observations" component={MyObservations} />
      <Route path="/learn" component={Learn} />
      <Route path="/collimation-guide" component={CollimationGuide} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <StarryBackground />
          <Navbar />
          <main className="flex-grow">
            <Router />
          </main>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;