import React, { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { User, Lock, Eye, EyeOff, Camera, Save } from "lucide-react";
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
    feeManagementPin?: string;
  };
}

export const LawyerSettings = () => {
  const [settings, setSettings] = useState<Settings>({
    profile: {
      name: "",
      email: "",
      phone: "",
      barNumber: "",
      experience: "",
      specialization: "",
      address: "",
      bio: "",
      profilePicture: "",
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      loginAlerts: true,
      feeManagementPin: "",
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showFeePin, setShowFeePin] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }
      console.log("Fetching settings from:", `${API_URL}/api/settings`);
      const res = await axios.get(`${API_URL}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Settings fetched successfully:", res.data);
      setSettings(res.data);
    } catch (err: any) {
      console.error(
        "Error fetching settings:",
        err.response?.data || err.message
      );
      if (err.response?.status === 401) {
        toast.error("Session expired. Please sign in again.");
        localStorage.removeItem("authToken");
        navigate("/login");
      } else {
        toast.error(err.response?.data?.error || "Failed to fetch settings");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      profile: { ...settings.profile, [name]: value || "" }, // Ensure empty strings are set
    });
  };

  const handleSecurityChange = (field: string, value: any) => {
    setSettings({
      ...settings,
      security: { ...settings.security, [field]: value },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast.error("Only JPG and PNG files are allowed");
        return;
      }
      setSelectedFile(file);
      console.log("Selected file:", file.name);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }
      if (!settings.profile.name || !settings.profile.email) {
        toast.error("Name and email are required");
        return;
      }

      let profilePicture = settings.profile.profilePicture;

      // Upload image if a file is selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append("profilePicture", selectedFile);
        console.log("Uploading profile picture");
        const uploadResponse = await axios.post(
          `${API_URL}/api/settings/profile-picture`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        profilePicture = uploadResponse.data.profilePicture;
        console.log("Profile picture uploaded:", profilePicture);
      }

      // Update profile data
      const profileData = {
        ...settings.profile,
        profilePicture: profilePicture || "",
        phone: settings.profile.phone || "",
        barNumber: settings.profile.barNumber || "",
        experience: settings.profile.experience || "",
        specialization: settings.profile.specialization || "",
        address: settings.profile.address || "",
        bio: settings.profile.bio || "",
      };
      console.log("Submitting profile update:", profileData);
      const response = await axios.put(
        `${API_URL}/api/settings/profile`,
        { profile: profileData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Profile update successful:", response.data);
      setSettings({ ...settings, profile: response.data.profile }); // Update state with response
      setSelectedFile(null); // Clear file input
      toast.success("Profile updated successfully");
    } catch (err: any) {
      console.error(
        "Error updating profile:",
        err.response?.data || err.message
      );
      toast.error(err.response?.data?.error || "Error updating profile");
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        toast.error("Current password is required to change password");
        return;
      }
      if (!newPassword) {
        toast.error("New password is required");
        return;
      }
      if (!confirmPassword) {
        toast.error("Confirm password is required");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("New password and confirmation do not match");
        return;
      }
      if (newPassword.length < 8) {
        toast.error("New password must be at least 8 characters long");
        return;
      }
    }
    if (
      settings.security.feeManagementPin &&
      !/^\d{4}$/.test(settings.security.feeManagementPin)
    ) {
      toast.error("PIN must be a 4-digit number");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const payload: any = {
        security: {
          twoFactorEnabled: settings.security.twoFactorEnabled,
          sessionTimeout: settings.security.sessionTimeout,
          loginAlerts: settings.security.loginAlerts,
          feeManagementPin: settings.security.feeManagementPin || undefined,
        },
      };
      if (currentPassword && newPassword && confirmPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
        payload.confirmPassword = newPassword;
      }
      console.log("Submitting security update:", payload);
      const response = await axios.put(
        `${API_URL}/api/settings/security`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Security update successful:", response.data);
      toast.success("Security settings updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSettings({
        ...settings,
        security: { ...settings.security, feeManagementPin: "" },
      });
    } catch (err: any) {
      console.error(
        "Error updating security:",
        err.response?.data || err.message
      );
      toast.error(
        err.response?.data?.error || "Error updating security settings"
      );
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Settings
        </h1>
        <p className="text-gray-600 text-sm md:text-base">
          Manage your profile and security settings
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading settings...</p>
        </div>
      ) : (
        <Tabs defaultValue="profile" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2 gap-1">
            <TabsTrigger value="profile" className="text-xs md:text-sm">
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs md:text-sm">
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="p-4 md:p-6">
              <form
                onSubmit={handleProfileSubmit}
                className="space-y-4 md:space-y-6"
              >
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                  <Avatar className="h-20 w-20 md:h-24 md:w-24">
                    {settings.profile.profilePicture ? (
                      <AvatarImage
                        src={settings.profile.profilePicture}
                        alt="Profile Picture"
                      />
                    ) : (
                      <AvatarFallback className="bg-blue-500 text-white text-xl md:text-2xl">
                        {settings.profile.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="text-center md:text-left">
                    <Label htmlFor="profile-picture" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <div>
                          <Camera className="w-4 h-4 mr-2" />
                          Change Photo
                        </div>
                      </Button>
                    </Label>
                    <Input
                      id="profile-picture"
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      JPG, PNG up to 2MB
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={settings.profile.name}
                      onChange={handleProfileChange}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={settings.profile.email}
                      onChange={handleProfileChange}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={settings.profile.phone || ""}
                      onChange={handleProfileChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="barNumber">Bar Number</Label>
                    <Input
                      id="barNumber"
                      name="barNumber"
                      value={settings.profile.barNumber || ""}
                      onChange={handleProfileChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Experience</Label>
                    <Input
                      id="experience"
                      name="experience"
                      value={settings.profile.experience || ""}
                      onChange={handleProfileChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      name="specialization"
                      value={settings.profile.specialization || ""}
                      onChange={handleProfileChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Chamber Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={settings.profile.address || ""}
                    onChange={handleProfileChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Brief description of your experience and expertise"
                    value={settings.profile.bio || ""}
                    onChange={handleProfileChange}
                    className="mt-1"
                  />
                </div>

                <Button type="submit" className="w-full md:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="p-4 md:p-6">
              <form
                onSubmit={handleSecuritySubmit}
                className="space-y-4 md:space-y-6"
              >
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Password</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="current-password"
                          type={showPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          required={!!newPassword || !!confirmPassword}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Fee Management PIN
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="fee-pin">
                        Set/Update PIN for Fee Management
                      </Label>
                      <div className="flex flex-col md:flex-row gap-2 mt-1">
                        <div className="relative flex-1">
                          <Input
                            id="fee-pin"
                            type={showFeePin ? "text" : "password"}
                            placeholder="Enter 4-digit PIN"
                            value={settings.security.feeManagementPin || ""}
                            onChange={(e) =>
                              handleSecurityChange(
                                "feeManagementPin",
                                e.target.value
                              )
                            }
                            maxLength={4}
                            className="text-center tracking-widest"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => setShowFeePin(!showFeePin)}
                          >
                            {showFeePin ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        This PIN will be required to access Fee Management
                        section
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Security Options
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <Label
                          htmlFor="two-factor"
                          className="text-sm md:text-base"
                        >
                          Two-Factor Authentication
                        </Label>
                        <p className="text-xs md:text-sm text-gray-500">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Switch
                        id="two-factor"
                        checked={settings.security.twoFactorEnabled}
                        onCheckedChange={(checked) =>
                          handleSecurityChange("twoFactorEnabled", checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <Label
                          htmlFor="login-alerts"
                          className="text-sm md:text-base"
                        >
                          Login Alerts
                        </Label>
                        <p className="text-xs md:text-sm text-gray-500">
                          Get notified of new login attempts
                        </p>
                      </div>
                      <Switch
                        id="login-alerts"
                        checked={settings.security.loginAlerts}
                        onCheckedChange={(checked) =>
                          handleSecurityChange("loginAlerts", checked)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="session-timeout">Session Timeout</Label>
                      <Select
                        value={settings.security.sessionTimeout.toString()}
                        onValueChange={(value) =>
                          handleSecurityChange(
                            "sessionTimeout",
                            parseInt(value)
                          )
                        }
                      >
                        <SelectTrigger className="w-full md:w-48 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full md:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  Save Security Settings
                </Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
