import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import api from "../lib/api";
import {
  Home,
  FolderOpen,
  Calendar,
  DollarSign,
  Users,
  Bell,
  Settings,
  Lock,
  Menu,
  X,
  LogOut,
  User,
  PieChart,
  Trash2,
  Unlock,
  AlertCircle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { PinModal } from "./PinModal";
import { useIsMobile } from "../hooks/use-mobile";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isFeeUnlocked, setIsFeeUnlocked] = useState(
    sessionStorage.getItem("feeUnlocked") === "true"
  );
  const [lawyerData, setLawyerData] = useState<{
    name: string;
    email: string;
    profilePicture?: string;
    id: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchLawyerData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/lawyers/me");
      const user = res.data.user;
      setLawyerData({
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        profilePicture: user.profilePicture || "",
        id: user.id || user._id,
      });
    } catch (err: any) {
      console.error("Error fetching lawyer data:", err);
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("feeUnlocked");
    setLawyerData(null);
    setIsFeeUnlocked(false);
    toast.success("Logged out successfully");
    navigate("/");
  };

  useEffect(() => {
    fetchLawyerData();
  }, []); // Only fetch once on mount, not on every route change

  const handlePinSubmit = async (enteredPin: string) => {
    try {
      const response = await api.post("/lawyers/verify-fee-key", { pin: enteredPin });
      if (response.data.success) {
        setIsFeeUnlocked(true);
        sessionStorage.setItem("feeUnlocked", "true");
        toast.success("PIN authenticated successfully");
        return true;
      }
      return false;
    } catch (err: any) {
      return false;
    }
  };

  const handlePinSuccess = (enteredPin: string) => {
    return handlePinSubmit(enteredPin).then((success) => {
      if (success) {
        setIsPinModalOpen(false);
        navigate("/fees");
      }
      return success;
    });
  };

  const handleLockFees = () => {
    sessionStorage.removeItem("feeUnlocked");
    setIsFeeUnlocked(false);
    toast.info("Financial Vault Locked");
    if (location.pathname === "/fees" || location.pathname === "/analytics") {
      navigate("/dashboard");
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Today's Diary", href: "/today", icon: Calendar },
    { name: "Cases", href: "/cases", icon: FolderOpen },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    {
      name: "Fee Management",
      href: "/fees",
      icon: DollarSign,
      locked: !isFeeUnlocked,
      onClick: () => {
        if (!isFeeUnlocked) {
          setIsPinModalOpen(true);
          return false;
        }
        return true;
      },
    },
    ...(isFeeUnlocked ? [{
      name: "Lock Vault",
      href: "#",
      icon: Unlock,
      onClick: () => {
        handleLockFees();
        return false;
      },
    }] : []),
    { name: "Clients", href: "/clients", icon: Users },
    { name: "Analytics", href: "/analytics", icon: PieChart },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const effectivelyCollapsed = isMobile ? true : isCollapsed;

  return (
    <>
      <div
        className={`bg-gray-900 text-white h-screen transition-all duration-300 ${effectivelyCollapsed ? "w-16" : "w-64"
          } flex flex-col sticky top-0 z-40 font-outfit`}
      >
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {!effectivelyCollapsed && (
              <h2 className="text-xl font-bold truncate tracking-tight text-blue-400">
                Lawyer's Diary
              </h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-400 hover:text-white"
            >
              {effectivelyCollapsed ? <Menu /> : <X />}
            </Button>
          </div>
        </div>

        <nav className="flex-1 py-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={(e) => {
                if (item.onClick && !item.onClick()) {
                  e.preventDefault();
                }
              }}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium transition-all ${isActive
                  ? "bg-gray-800 text-blue-400 border-r-2 border-blue-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
                } ${effectivelyCollapsed ? "justify-center" : ""}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!effectivelyCollapsed && (
                <span className="ml-3 flex items-center justify-between w-full">
                  <span className="truncate">{item.name}</span>
                  {item.locked && <Lock className="w-3.5 h-3.5 text-yellow-500" />}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          {!effectivelyCollapsed && lawyerData && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-gray-700">
                  <AvatarImage src={lawyerData.profilePicture} />
                  <AvatarFallback className="bg-blue-600">
                    {lawyerData.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="truncate">
                  <p className="text-sm font-semibold truncate">{lawyerData.name}</p>
                  <p className="text-xs text-gray-500 truncate">{lawyerData.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          )}
          {effectivelyCollapsed && (
            <Button variant="ghost" size="icon" onClick={handleLogout} className="w-full text-gray-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
      />
    </>
  );
};
