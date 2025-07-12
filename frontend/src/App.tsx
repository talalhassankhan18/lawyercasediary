
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { CaseManagement } from "./components/CaseManagement";
import { FeeManagement } from "./components/FeeManagement";
import { LawyerCalendar } from "./components/LawyerCalendar";
import { LawyerClients } from "./components/LawyerClients";
import { LawyerNotifications } from "./components/LawyerNotifications";
import { LawyerSettings } from "./components/LawyerSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 overflow-auto ml-12 md:ml-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/cases" element={<CaseManagement />} />
              <Route path="/fees" element={<FeeManagement />} />
              <Route path="/calendar" element={<LawyerCalendar />} />
              <Route path="/clients" element={<LawyerClients />} />
              <Route path="/notifications" element={<LawyerNotifications />} />
              <Route path="/settings" element={<LawyerSettings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
