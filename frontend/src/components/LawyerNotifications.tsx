
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  Calendar, 
  DollarSign, 
  FileText, 
  Gavel, 
  Mail,
  MessageSquare,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

export const LawyerNotifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'hearing',
      title: 'Upcoming Hearing Reminder',
      message: 'Property dispute case hearing scheduled for tomorrow at 10:00 AM in District Court Room 3',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      priority: 'high'
    },
    {
      id: 2,
      type: 'payment',
      title: 'Payment Received',
      message: 'Ahmed Ali has paid Rs 25,000 for case #12345',
      time: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: false,
      priority: 'medium'
    },
    {
      id: 3,
      type: 'client',
      title: 'New Client Inquiry',
      message: 'New consultation request from Sara Khan for family law matter',
      time: new Date(Date.now() - 6 * 60 * 60 * 1000),
      read: true,
      priority: 'medium'
    },
    {
      id: 4,
      type: 'document',
      title: 'Document Submitted',
      message: 'Client has submitted required documents for case #12346',
      time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      read: true,
      priority: 'low'
    },
    {
      id: 5,
      type: 'deadline',
      title: 'Case Deadline Approaching',
      message: 'Filing deadline for criminal defense case is in 3 days',
      time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: false,
      priority: 'high'
    }
  ]);

  const [settings, setSettings] = useState({
    hearingReminders: true,
    paymentNotifications: true,
    clientMessages: true,
    deadlineAlerts: true,
    emailNotifications: false,
    smsNotifications: true,
    pushNotifications: true
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'hearing': return <Gavel className="w-5 h-5 text-blue-600" />;
      case 'payment': return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'client': return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case 'document': return <FileText className="w-5 h-5 text-orange-600" />;
      case 'deadline': return <Clock className="w-5 h-5 text-red-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-200';
      case 'medium': return 'bg-yellow-100 border-yellow-200';
      case 'low': return 'bg-green-100 border-green-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with important alerts and messages</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{unreadCount} unread</Badge>
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Notifications</h2>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  } ${getPriorityColor(notification.priority)}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={notification.priority === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {notification.priority}
                          </Badge>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {format(notification.time, 'MMM dd, yyyy at hh:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Notification Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Notification Settings</h2>
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Alert Types</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="hearing-reminders" className="text-sm">Hearing Reminders</Label>
                <Switch
                  id="hearing-reminders"
                  checked={settings.hearingReminders}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, hearingReminders: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="payment-notifications" className="text-sm">Payment Notifications</Label>
                <Switch
                  id="payment-notifications"
                  checked={settings.paymentNotifications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, paymentNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="client-messages" className="text-sm">Client Messages</Label>
                <Switch
                  id="client-messages"
                  checked={settings.clientMessages}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, clientMessages: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="deadline-alerts" className="text-sm">Deadline Alerts</Label>
                <Switch
                  id="deadline-alerts"
                  checked={settings.deadlineAlerts}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, deadlineAlerts: checked }))
                  }
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Delivery Methods</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="text-sm">Email Notifications</Label>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between mt-3">
                <Label htmlFor="sms-notifications" className="text-sm">SMS Notifications</Label>
                <Switch
                  id="sms-notifications"
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, smsNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between mt-3">
                <Label htmlFor="push-notifications" className="text-sm">Push Notifications</Label>
                <Switch
                  id="push-notifications"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, pushNotifications: checked }))
                  }
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Today's Hearings</p>
              <p className="text-lg font-semibold">3</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Payments</p>
              <p className="text-lg font-semibold">2</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">New Messages</p>
              <p className="text-lg font-semibold">5</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Urgent Tasks</p>
              <p className="text-lg font-semibold">1</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
