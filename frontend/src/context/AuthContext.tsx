import React, { createContext, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Lawyer } from "../../../types/lawyer";

interface AuthContextType {
  user: Lawyer | null | undefined;
  isLoading: boolean;
  error: any;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");
      const response = await axios.get("http://localhost:5000/lawyers/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.user as Lawyer;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  useEffect(() => {
    if (error) {
      console.error("Error fetching user:", error);
      toast.error(error.message || "Failed to load user data");
      localStorage.removeItem("authToken");
      navigate("/login");
    }
  }, [error, navigate]);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};