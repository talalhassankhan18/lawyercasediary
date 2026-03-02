import React, { useState, useEffect } from "react";
import api from "../lib/api";
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
import { User, Lock, Eye, EyeOff, Camera, Save, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  const [updating, setUpdating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [lawyerRes, settingsRes] = await Promise.all([
        api.get("/lawyers/me"),
        api.get("/settings")
      ]);

      const lawyerData = lawyerRes.data.user;
      const settingsData = settingsRes.data;

      setSettings({
        profile: {
          name: `${lawyerData.firstName} ${lawyerData.lastName}`,
          email: lawyerData.email,
          phone: lawyerData.phoneNumber || "",
          barNumber: settingsData.profile.barNumber || "",
          experience: settingsData.profile.experience || "",
          specialization: settingsData.profile.specialization || "",
          address: settingsData.profile.address || "",
          bio: settingsData.profile.bio || "",
          profilePicture: lawyerData.profilePicture || "",
        },
        security: {
          twoFactorEnabled: lawyerData.twoFactorEnabled || false,
          sessionTimeout: lawyerData.sessionTimeout || 30,
          loginAlerts: lawyerData.loginAlerts || true,
          feeManagementPin: "",
        },
      });
    } catch (err: any) {
      console.error("Error fetching settings:", err);
      toast.error("Failed to fetch settings");
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
    setSettings(prev => ({
      ...prev,
      profile: { ...prev.profile, [name]: value || "" },
    }));
  };

  const handleSecurityChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      security: { ...prev.security, [field]: value },
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }

      setUpdating(true);
      try {
        const formData = new FormData();
        formData.append("profilePicture", file);

        // Use the dedicated profile picture endpoint
        const uploadResponse = await api.post("/settings/profile-picture", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        const newUrl = uploadResponse.data.profilePicture;
        setSettings(prev => ({
          ...prev,
          profile: { ...prev.profile, profilePicture: newUrl }
        }));
        toast.success("Profile picture updated!");
      } catch (err: any) {
        toast.error("Failed to upload image");
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const nameParts = settings.profile.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      await api.put("/lawyers/profile", {
        firstName,
        lastName,
        email: settings.profile.email,
        phoneNumber: settings.profile.phone || "",
        profilePicture: settings.profile.profilePicture || "",
      });

      const settingsResponse = await api.put("/settings/profile", {
        profile: {
          ...settings.profile,
        },
      });

      setSettings(prev => ({ ...prev, profile: settingsResponse.data.profile }));
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error updating profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    try {
      setUpdating(true);
      await api.put("/settings/security", {
        currentPassword,
        newPassword,
        confirmPassword,
        security: {
          // Keep original values or send empty as the backend expects the 'security' object
          twoFactorEnabled: settings.security.twoFactorEnabled,
          sessionTimeout: settings.security.sessionTimeout,
          loginAlerts: settings.security.loginAlerts
        }
      });
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error updating password");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto font-outfit">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your profile and account security</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading settings...</div>
      ) : (
        <Tabs defaultValue="profile">
          <TabsList className="grid grid-cols-2 w-full max-w-sm mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="flex flex-col items-center gap-4 bg-gray-50 p-6 rounded-xl border border-dashed">
                  <Avatar className="h-28 w-28 border-4 border-white shadow-lg">
                    <AvatarImage src={settings.profile.profilePicture} className="object-cover" />
                    <AvatarFallback className="bg-blue-600 text-white text-3xl">
                      {settings.profile.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={updating}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {updating ? "Uploading..." : "Change Photo"}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider font-semibold">Max 2MB (JPG/PNG)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input name="name" value={settings.profile.name} onChange={handleProfileChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input name="email" type="email" value={settings.profile.email} onChange={handleProfileChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input name="phone" value={settings.profile.phone} onChange={handleProfileChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bar Number</Label>
                    <Input name="barNumber" value={settings.profile.barNumber} onChange={handleProfileChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Specialization</Label>
                    <Input name="specialization" value={settings.profile.specialization} onChange={handleProfileChange} placeholder="e.g. Criminal Law, Family Law" />
                  </div>
                  <div className="space-y-2">
                    <Label>Experience</Label>
                    <Input name="experience" value={settings.profile.experience} onChange={handleProfileChange} placeholder="e.g. 10 Years" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Office Address</Label>
                    <Input name="address" value={settings.profile.address} onChange={handleProfileChange} placeholder="Your office address..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Professional Bio</Label>
                  <Textarea name="bio" value={settings.profile.bio} onChange={handleProfileChange} placeholder="Tell us about your practice..." className="h-32" />
                </div>

                <Button type="submit" disabled={updating}>
                  {updating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="p-6">
              <form onSubmit={handleSecuritySubmit} className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Lock className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Change Password</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">Enter your current password and choose a new secure one.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Current Password</Label>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm New Password</Label>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setShowPassword(!showPassword)}>
                      <Button type="button" variant="ghost" size="sm" className="p-0 h-auto text-xs text-gray-500 hover:text-blue-500">
                        {showPassword ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                        {showPassword ? "Hide" : "Show"} Passwords
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="text-xs text-blue-600 h-auto p-0"
                      onClick={async () => {
                        try {
                          setUpdating(true);
                          await api.post("/lawyers/forgot-password", { email: settings.profile.email });
                          toast.success("A password reset link has been sent to your email.");
                        } catch (err: any) {
                          toast.error("Failed to send reset link.");
                        } finally {
                          setUpdating(false);
                        }
                      }}
                      disabled={updating}
                    >
                      Forgot current password?
                    </Button>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t mt-8">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Lock className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Fee Management PIN</h3>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 text-amber-800 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>
                      Set a **4-digit PIN** to secure the Fee Management and Analytics section.
                      This prevents clerks or unauthorized users from viewing your financial records.
                    </p>
                  </div>

                  <div className="max-w-xs space-y-2">
                    <Label>New 4-Digit PIN</Label>
                    <div className="relative">
                      <Input
                        type={showFeePin ? "text" : "password"}
                        maxLength={4}
                        placeholder="e.g. 1234"
                        value={settings.security.feeManagementPin}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                          handleSecurityChange("feeManagementPin", val);
                        }}
                        className="text-lg tracking-[1em] font-mono text-center pl-8"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400"
                        onClick={() => setShowFeePin(!showFeePin)}
                      >
                        {showFeePin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex justify-end">
                  <Button type="submit" size="lg" className="px-12" disabled={updating}>
                    {updating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Security Settings
                  </Button>
                </div>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
