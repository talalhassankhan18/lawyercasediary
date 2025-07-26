import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
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
import { Profile } from "./components/Profile";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 overflow-auto ml-12 md:ml-0">
                  <Dashboard />
                </div>
              </div>
            }
          />
          <Route
            path="/cases"
            element={
              <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 overflow-auto ml-12 md:ml-0">
                  <CaseManagement />
                </div>
              </div>
            }
          />
          <Route
            path="/fees"
            element={
              <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 overflow-auto ml-12 md:ml-0">
                  <FeeManagement />
                </div>
              </div>
            }
          />
          <Route
            path="/calendar"
            element={
              <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 overflow-auto ml-12 md:ml-0">
                  <LawyerCalendar />
                </div>
              </div>
            }
          />
          <Route
            path="/clients"
            element={
              <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 overflow-auto ml-12 md:ml-0">
                  <LawyerClients />
                </div>
              </div>
            }
          />
          <Route
            path="/notifications"
            element={
              <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 overflow-auto ml-12 md:ml-0">
                  <LawyerNotifications />
                </div>
              </div>
            }
          />
          <Route
            path="/profile"
            element={
              <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 overflow-auto ml-12 md:ml-0">
                  <Profile />
                </div>
              </div>
            }
          />
          <Route
            path="/settings"
            element={
              <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 overflow-auto ml-12 md:ml-0">
                  <LawyerSettings />
                </div>
              </div>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
