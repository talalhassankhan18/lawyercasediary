
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
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
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PinModal } from './PinModal';
import { useIsMobile } from '@/hooks/use-mobile';

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isFeeUnlocked, setIsFeeUnlocked] = useState(false);
  const isMobile = useIsMobile();

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

  // On mobile, always show collapsed sidebar
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
          {navigation.map((item) => (
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
          ))}
        </nav>

        <div className={`p-2 md:p-4 border-t border-gray-700 ${effectivelyCollapsed ? 'px-1' : ''}`}>
          {!effectivelyCollapsed && (
            <div className="text-xs text-gray-400 space-y-1">
              <p>Subscription: Active</p>
              <p>Version 1.0.0</p>
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
