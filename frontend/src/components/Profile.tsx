import React, { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { User, Lock, Settings } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface Settings {
  profile: {
    name: string;
    email: string;
    phone?: string;
    barNumber?: string;
    experience?: string;
    specialization?: string;
    address?: string;
    bio?: string;
    profilePicture?: string;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    loginAlerts: boolean;
  };
}

export const Profile = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }
      console.log("Fetching profile from:", `${API_URL}/api/settings`);
      const res = await axios.get(`${API_URL}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Profile data fetched successfully:", res.data);
      setSettings(res.data);
    } catch (err: any) {
      console.error(
        "Error fetching profile:",
        err.response?.data || err.message
      );
      if (err.response?.status === 401) {
        toast.error("Session expired. Please sign in again.");
        localStorage.removeItem("authToken");
        navigate("/login");
      } else {
        toast.error(err.response?.data?.error || "Failed to fetch profile");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto bg-gray-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            My Profile
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            View your profile and security settings
          </p>
        </div>
        <Button
          variant="outline"
          className="text-xs md:text-sm border-gray-600 hover:bg-gray-200"
          onClick={() => navigate("/settings")}
        >
          <Settings className="w-4 h-4 mr-2" />
          Edit Settings
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      ) : settings ? (
        <div className="space-y-6">
          <Card className="p-4 md:p-6 bg-white">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Profile Information
            </h2>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <Avatar className="h-24 w-24 md:h-32 md:w-32">
                  {settings.profile.profilePicture ? (
                    <AvatarImage
                      src={settings.profile.profilePicture}
                      alt="Profile Picture"
                    />
                  ) : (
                    <AvatarFallback className="bg-blue-500 text-white text-2xl md:text-3xl">
                      {settings.profile.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="text-base md:text-lg font-medium text-gray-900">
                    {settings.profile.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-base md:text-lg font-medium text-gray-900">
                    {settings.profile.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-base md:text-lg font-medium text-gray-900">
                    {settings.profile.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bar Number</p>
                  <p className="text-base md:text-lg font-medium text-gray-900">
                    {settings.profile.barNumber || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Experience</p>
                  <p className="text-base md:text-lg font-medium text-gray-900">
                    {settings.profile.experience || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Specialization</p>
                  <p className="text-base md:text-lg font-medium text-gray-900">
                    {settings.profile.specialization || "Not provided"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Chamber Address</p>
                  <p className="text-base md:text-lg font-medium text-gray-900">
                    {settings.profile.address || "Not provided"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Professional Bio</p>
                  <p className="text-base md:text-lg font-medium text-gray-900">
                    {settings.profile.bio || "Not provided"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 bg-white">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Security Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">
                  Two-Factor Authentication
                </p>
                <p className="text-base md:text-lg font-medium text-gray-900">
                  {settings.security.twoFactorEnabled ? "Enabled" : "Disabled"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Session Timeout</p>
                <p className="text-base md:text-lg font-medium text-gray-900">
                  {settings.security.sessionTimeout} minutes
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Login Alerts</p>
                <p className="text-base md:text-lg font-medium text-gray-900">
                  {settings.security.loginAlerts ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No profile data available</p>
        </div>
      )}
    </div>
  );
};
