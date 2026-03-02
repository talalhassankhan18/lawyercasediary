import React, { useState, useEffect } from "react";
import api from "../lib/api";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { User, Lock, Settings } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SettingsData {
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
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/settings");
      // Check if we got valid profile data
      if (res.data?.profile?.name) {
        setSettings(res.data);
      } else {
        // Fallback: build from /lawyers/me
        const meRes = await api.get("/lawyers/me");
        const user = meRes.data.user;
        setSettings({
          profile: {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            phone: user.phoneNumber || "",
            profilePicture: user.profilePicture || "",
          },
          security: {
            twoFactorEnabled: user.twoFactorEnabled || false,
            sessionTimeout: user.sessionTimeout || 30,
            loginAlerts: user.loginAlerts ?? true,
          },
        });
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      // Try fallback on any error
      try {
        const meRes = await api.get("/lawyers/me");
        const user = meRes.data.user;
        setSettings({
          profile: {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            phone: user.phoneNumber || "",
            profilePicture: user.profilePicture || "",
          },
          security: {
            twoFactorEnabled: user.twoFactorEnabled || false,
            sessionTimeout: user.sessionTimeout || 30,
            loginAlerts: user.loginAlerts ?? true,
          },
        });
      } catch {
        toast.error("Failed to load profile data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-outfit">Loading profile...</div>;
  }

  if (!settings) {
    return <div className="p-8 text-center text-gray-500 font-outfit">No profile data found.</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto font-outfit">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Your professional identity</p>
        </div>
        <Button onClick={() => navigate("/settings")} variant="outline">
          <Settings className="w-4 h-4 mr-2" /> Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col items-center text-center">
          <Avatar className="h-32 w-32 mb-4 border-2">
            <AvatarImage src={settings.profile.profilePicture} />
            <AvatarFallback className="bg-black text-white text-3xl">
              {settings.profile.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold">{settings.profile.name}</h2>
          <p className="text-gray-500 text-sm mb-4">{settings.profile.specialization || "Advocate"}</p>
          <div className="w-full pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Bar Number</span>
              <span className="font-medium">{settings.profile.barNumber || "N/A"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Experience</span>
              <span className="font-medium">{settings.profile.experience || "N/A"}</span>
            </div>
          </div>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" /> Professional Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Email Address</p>
                <p className="font-medium">{settings.profile.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone Number</p>
                <p className="font-medium">{settings.profile.phone || "Not provided"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-gray-500">Office Address</p>
                <p className="font-medium">{settings.profile.address || "Not provided"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-gray-500">Bio</p>
                <p className="text-gray-700 mt-1">{settings.profile.bio || "No bio available."}</p>
              </div>
            </div>
          </Card>


        </div>
      </div>
    </div>
  );
};
