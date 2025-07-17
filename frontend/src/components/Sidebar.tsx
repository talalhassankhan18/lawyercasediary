import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  LogOut
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { PinModal } from './PinModal';
import { useIsMobile } from '../hooks/use-mobile';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Debug log to verify environment variable
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isFeeUnlocked, setIsFeeUnlocked] = useState(false);
  const [lawyerData, setLawyerData] = useState<{ name: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const fetchLawyerData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      console.log('Auth token:', token);
      if (!token) {
        toast.error('No authentication token found. Please sign in.');
        navigate('/login');
        return;
      }
      const res = await axios.get(`${API_URL}/lawyers/me`, {
        headers: { Authorization: `Bearer ${token}` }, // Fixed Authorization header
      });
      console.log('Lawyer data response:', res.data);
      setLawyerData({
        name: `${res.data.user.firstName} ${res.data.user.lastName}`,
        email: res.data.user.email || 'N/A'
      });
    } catch (err: any) {
      console.error('Error fetching lawyer data:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please sign in again.');
        localStorage.removeItem('authToken');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.error || 'Failed to fetch user data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setLawyerData(null);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  useEffect(() => {
    fetchLawyerData();
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Cases', href: '/cases', icon: FolderOpen },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    {
      name: 'Fee Management',
      href: '/fees',
      icon: DollarSign,
      locked: !isFeeUnlocked,
      onClick: () => {
        if (!isFeeUnlocked) {
          setIsPinModalOpen(true);
          return false;
        }
        return true;
      }
    },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handlePinSuccess = () => {
    setIsFeeUnlocked(true);
    setIsPinModalOpen(false);
  };

  const effectivelyCollapsed = isMobile ? true : isCollapsed;

  return (
    <>
      <div className={`bg-gray-900 text-white h-screen transition-all duration-300 ${
        effectivelyCollapsed ? 'w-12 md:w-16' : 'w-64'
      } flex flex-col fixed md:relative z-40 md:z-auto`}>
        <div className={`p-2 md:p-4 border-b border-gray-700 ${effectivelyCollapsed ? 'px-1 md:px-2' : ''}`}>
          <div className="flex items-center justify-between">
            {!effectivelyCollapsed && (
              <h2 className="text-lg md:text-xl font-bold truncate">Lawyer's Diary</h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-white hover:bg-gray-700 h-8 w-8 md:h-10 md:w-10"
            >
              {effectivelyCollapsed ? <Menu className="w-3 h-3 md:w-4 md:h-4" /> : <X className="w-3 h-3 md:w-4 md:h-4" />}
            </Button>
          </div>
        </div>

        <nav className="flex-1 py-2 md:py-4 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4 text-gray-400">Loading...</div>
          ) : (
            navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={(e) => {
                  if (item.onClick && !item.onClick()) {
                    e.preventDefault();
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors hover:bg-gray-700 ${
                    isActive ? 'bg-gray-700 border-r-2 md:border-r-4 border-blue-500' : ''
                  } ${effectivelyCollapsed ? 'justify-center' : ''}`
                }
              >
                <item.icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                {!effectivelyCollapsed && (
                  <span className="ml-2 md:ml-3 flex items-center gap-1 md:gap-2 truncate">
                    <span className="truncate">{item.name}</span>
                    {item.locked && <Lock className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 flex-shrink-0" />}
                  </span>
                )}
              </NavLink>
            ))
          )}
        </nav>

        <div className={`p-2 md:p-4 border-t border-gray-700 ${effectivelyCollapsed ? 'px-1' : ''}`}>
          {!effectivelyCollapsed && lawyerData && !isLoading && (
            <div className="text-xs text-gray-400 space-y-2">
              <div>
                <p className="font-medium text-white truncate">{lawyerData.name}</p>
                <p className="truncate">{lawyerData.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs text-white border-gray-600 hover:bg-gray-700"
                onClick={handleLogout}
              >
                <LogOut className="w-3 h-3 mr-2" />
                Logout
              </Button>
            </div>
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