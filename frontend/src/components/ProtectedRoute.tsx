import React from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Lawyer } from "../../../types/lawyer";

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { user, isLoading } = useAuth() as { user: Lawyer | null | undefined; isLoading: boolean };
  const token = localStorage.getItem("authToken");

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!token || !user) {
    toast.error("Please log in to access this page");
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;