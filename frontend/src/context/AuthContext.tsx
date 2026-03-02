import React, { createContext, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
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
      if (!token) return null;
      try {
        const response = await api.get("/lawyers/me");
        return response.data.user as Lawyer;
      } catch (err) {
        localStorage.removeItem("authToken");
        throw err;
      }
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
      toast.error("Session expired or authentication failed. Please sign in again.");
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