import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { 
  User, 
  Lock, 
  Bell, 
  DollarSign, 
  Calendar,
  Shield,
  Eye,
  EyeOff,
  Camera,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

export const LawyerSettings = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showFeePin, setShowFeePin] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Advocate Muhammad Hassan',
    email: 'hassan.lawyer@email.com',
    phone: '+92 300 1234567',
    barNumber: 'LAW-2020-12345',
    experience: '8 years',
    specialization: 'Criminal Law, Family Law',
    address: 'Chamber 12, District Court, Islamabad',
    bio: 'Experienced lawyer with expertise in criminal and family law matters.'
  });

  const [fees, setFees] = useState({
    consultationFee: 5000,
    hourlyRate: 8000,
    courtAppearance: 15000,
    documentDrafting: 3000
  });

  const [availability, setAvailability] = useState({
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '13:00' },
    sunday: { enabled: false, start: '09:00', end: '13:00' }
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    hearingReminders: true,
    paymentAlerts: true,
    clientMessages: true
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: '30',
    loginAlerts: true,
    feeManagementPin: ''
  });

  const handleFeePinUpdate = () => {
    if (security.feeManagementPin.length < 4 || security.feeManagementPin.length > 6) {
      toast.error('PIN must be 4-6 digits long');
      return;
    }
    if (!/^\d+$/.test(security.feeManagementPin)) {
      toast.error('PIN must contain only numbers');
      return;
    }
    // Store the PIN (in a real app, this would be encrypted and stored securely)
    localStorage.setItem('feeManagementPin', security.feeManagementPin);
    toast.success('Fee Management PIN updated successfully');
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 text-sm md:text-base">Manage your profile, preferences, and account settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1">
          <TabsTrigger value="profile" className="text-xs md:text-sm">Profile</TabsTrigger>
          <TabsTrigger value="fees" className="text-xs md:text-sm">Fees</TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs md:text-sm hidden md:block">Schedule</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs md:text-sm hidden md:block">Notifications</TabsTrigger>
          <TabsTrigger value="security" className="text-xs md:text-sm">Security</TabsTrigger>
        </TabsList>

        {/* Mobile-only additional tabs */}
        <div className="md:hidden">
          <TabsList className="grid w-full grid-cols-2 gap-1">
            <TabsTrigger value="schedule" className="text-xs">Schedule</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs">Notifications</TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card className="p-4 md:p-6">
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                <Avatar className="h-20 w-20 md:h-24 md:w-24">
                  <AvatarFallback className="bg-blue-500 text-white text-xl md:text-2xl">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left">
                  <Button variant="outline" size="sm">
                    <Camera className="w-4 h-4 mr-2" />
                    Change Photo
                  </Button>
                  <p className="text-sm text-gray-500 mt-1">JPG, PNG up to 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="bar-number">Bar Number</Label>
                  <Input 
                    id="bar-number" 
                    value={profile.barNumber}
                    onChange={(e) => setProfile({...profile, barNumber: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="experience">Experience</Label>
                  <Input 
                    id="experience" 
                    value={profile.experience}
                    onChange={(e) => setProfile({...profile, experience: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input 
                    id="specialization" 
                    value={profile.specialization}
                    onChange={(e) => setProfile({...profile, specialization: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Chamber Address</Label>
                <Textarea 
                  id="address" 
                  value={profile.address}
                  onChange={(e) => setProfile({...profile, address: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Brief description of your experience and expertise"
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  className="mt-1"
                />
              </div>

              <Button className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Fee Settings */}
        <TabsContent value="fees">
          <Card className="p-4 md:p-6">
            <div className="space-y-4 md:space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 md:mb-4">Fee Structure</h3>
                <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">Set your consultation and service fees that will be displayed to potential clients</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <Label htmlFor="consultation-fee">Initial Consultation Fee (Rs)</Label>
                  <Input 
                    id="consultation-fee" 
                    type="number"
                    value={fees.consultationFee}
                    onChange={(e) => setFees({...fees, consultationFee: parseInt(e.target.value)})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="hourly-rate">Hourly Rate (Rs)</Label>
                  <Input 
                    id="hourly-rate" 
                    type="number"
                    value={fees.hourlyRate}
                    onChange={(e) => setFees({...fees, hourlyRate: parseInt(e.target.value)})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="court-appearance">Court Appearance Fee (Rs)</Label>
                  <Input 
                    id="court-appearance" 
                    type="number"
                    value={fees.courtAppearance}
                    onChange={(e) => setFees({...fees, courtAppearance: parseInt(e.target.value)})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="document-drafting">Document Drafting Fee (Rs)</Label>
                  <Input 
                    id="document-drafting" 
                    type="number"
                    value={fees.documentDrafting}
                    onChange={(e) => setFees({...fees, documentDrafting: parseInt(e.target.value)})}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Fee Display Preview</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Initial Consultation: Rs {fees.consultationFee.toLocaleString()}</p>
                  <p>• Hourly Rate: Rs {fees.hourlyRate.toLocaleString()}/hour</p>
                  <p>• Court Appearance: Rs {fees.courtAppearance.toLocaleString()}</p>
                  <p>• Document Drafting: Rs {fees.documentDrafting.toLocaleString()}</p>
                </div>
              </div>

              <Button className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                Save Fee Structure
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Schedule Settings */}
        <TabsContent value="schedule">
          <Card className="p-4 md:p-6">
            <div className="space-y-4 md:space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 md:mb-4">Availability Schedule</h3>
                <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">Set your working hours that will be visible to clients for booking consultations</p>
              </div>

              <div className="space-y-3 md:space-y-4">
                {Object.entries(availability).map(([day, schedule]) => (
                  <div key={day} className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 border rounded-lg space-y-3 md:space-y-0">
                    <div className="flex items-center gap-3 md:gap-4">
                      <Switch
                        checked={schedule.enabled}
                        onCheckedChange={(checked) => 
                          setAvailability({
                            ...availability,
                            [day]: { ...schedule, enabled: checked }
                          })
                        }
                      />
                      <span className="font-medium capitalize w-16 md:w-20">{day}</span>
                    </div>
                    
                    {schedule.enabled && (
                      <div className="flex items-center gap-2 justify-center md:justify-end">
                        <Input
                          type="time"
                          value={schedule.start}
                          onChange={(e) => 
                            setAvailability({
                              ...availability,
                              [day]: { ...schedule, start: e.target.value }
                            })
                          }
                          className="w-28 md:w-32"
                        />
                        <span className="text-gray-500 text-sm">to</span>
                        <Input
                          type="time"
                          value={schedule.end}
                          onChange={(e) => 
                            setAvailability({
                              ...availability,
                              [day]: { ...schedule, end: e.target.value }
                            })
                          }
                          className="w-28 md:w-32"
                        />
                      </div>
                    )}
                    
                    {!schedule.enabled && (
                      <span className="text-gray-400 text-center md:text-right">Unavailable</span>
                    )}
                  </div>
                ))}
              </div>

              <Button className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                Save Schedule
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="p-4 md:p-6">
            <div className="space-y-4 md:space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 md:mb-4">Notification Preferences</h3>
                <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">Choose how you want to receive notifications and alerts</p>
              </div>

              <div className="space-y-4 md:space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Delivery Methods</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications" className="text-sm md:text-base">Email Notifications</Label>
                      <Switch
                        id="email-notifications"
                        checked={notifications.emailNotifications}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, emailNotifications: checked})
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sms-notifications" className="text-sm md:text-base">SMS Notifications</Label>
                      <Switch
                        id="sms-notifications"
                        checked={notifications.smsNotifications}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, smsNotifications: checked})
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-notifications" className="text-sm md:text-base">Push Notifications</Label>
                      <Switch
                        id="push-notifications"
                        checked={notifications.pushNotifications}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, pushNotifications: checked})
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Alert Types</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="hearing-reminders" className="text-sm md:text-base">Hearing Reminders</Label>
                      <Switch
                        id="hearing-reminders"
                        checked={notifications.hearingReminders}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, hearingReminders: checked})
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="payment-alerts" className="text-sm md:text-base">Payment Alerts</Label>
                      <Switch
                        id="payment-alerts"
                        checked={notifications.paymentAlerts}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, paymentAlerts: checked})
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="client-messages" className="text-sm md:text-base">Client Messages</Label>
                      <Switch
                        id="client-messages"
                        checked={notifications.clientMessages}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, clientMessages: checked})
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card className="p-4 md:p-6">
            <div className="space-y-4 md:space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 md:mb-4">Security Settings</h3>
                <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">Manage your account security and privacy settings</p>
              </div>

              <div className="space-y-4 md:space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Password</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative mt-1">
                        <Input 
                          id="current-password" 
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input 
                        id="new-password" 
                        type="password"
                        placeholder="Enter new password"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input 
                        id="confirm-password" 
                        type="password"
                        placeholder="Confirm new password"
                        className="mt-1"
                      />
                    </div>
                    <Button variant="outline" className="w-full md:w-auto">Update Password</Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Fee Management PIN</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="fee-pin">Set/Update PIN for Fee Management</Label>
                      <div className="flex flex-col md:flex-row gap-2 mt-1">
                        <div className="relative flex-1">
                          <Input 
                            id="fee-pin" 
                            type={showFeePin ? "text" : "password"}
                            placeholder="Enter 4-6 digit PIN"
                            value={security.feeManagementPin}
                            onChange={(e) => setSecurity({...security, feeManagementPin: e.target.value})}
                            maxLength={6}
                            className="text-center tracking-widest"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => setShowFeePin(!showFeePin)}
                          >
                            {showFeePin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                        <Button 
                          onClick={handleFeePinUpdate} 
                          disabled={!security.feeManagementPin}
                          className="w-full md:w-auto"
                        >
                          Update PIN
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        This PIN will be required to access Fee Management section
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Security Options</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <Label htmlFor="two-factor" className="text-sm md:text-base">Two-Factor Authentication</Label>
                        <p className="text-xs md:text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <Switch
                        id="two-factor"
                        checked={security.twoFactor}
                        onCheckedChange={(checked) => 
                          setSecurity({...security, twoFactor: checked})
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <Label htmlFor="login-alerts" className="text-sm md:text-base">Login Alerts</Label>
                        <p className="text-xs md:text-sm text-gray-500">Get notified of new login attempts</p>
                      </div>
                      <Switch
                        id="login-alerts"
                        checked={security.loginAlerts}
                        onCheckedChange={(checked) => 
                          setSecurity({...security, loginAlerts: checked})
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="session-timeout">Session Timeout</Label>
                      <Select 
                        value={security.sessionTimeout}
                        onValueChange={(value) => setSecurity({...security, sessionTimeout: value})}
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
              </div>

              <Button className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                Save Security Settings
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
