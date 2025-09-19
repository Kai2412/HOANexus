import React from 'react';
import { ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import ThemeToggle from '../ThemeToggle';
import { useAuth } from '../../context';

interface HeaderProps {
  onLogout?: () => void;
  children?: React.ReactNode; // For community selector or other content
}

const Header: React.FC<HeaderProps> = ({ 
  onLogout,
  children 
}) => {
  const { user } = useAuth();
  return (
    <header className="bg-royal-600 text-white shadow-lg">
      <div className="h-[70px] flex items-center justify-between px-0">
        {/* Logo Section - Left */}
        <div className="flex items-center h-full">
          <img
            src="/assets/hoa-nexus-logo.png"
            alt="HOA Nexus Logo"
            className="h-[70px] w-[70px] object-cover object-center"
          />
          <h1 className="text-3xl font-bold tracking-wide ml-4 whitespace-nowrap">
            HOA NEXUS
          </h1>
        </div>

        {/* Center Content - Flexible for any content */}
        {children && (
          <div className="flex-1 flex justify-center px-8">
            {children}
          </div>
        )}

        {/* Right Section - Actions */}
        <div className="flex items-center gap-4 px-6">
          {/* User Greeting */}
          {user && (
            <div className="flex items-center gap-2 text-white/90">
              <UserCircleIcon className="w-5 h-5" />
              <div className="text-right">
                <div className="text-sm font-medium">
                  Hi, {user.firstName || user.username}
                </div>
                <div className="text-xs text-white/70">
                  {user.type}{user.subType ? ` - ${user.subType}` : ''}
                </div>
              </div>
            </div>
          )}

          {/* Theme Toggle */}
          <ThemeToggle className="bg-white/10 hover:bg-white/20 text-white hover:text-white border-white/20 theme-transition" />

          {/* Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-white text-opacity-80 hover:text-opacity-100 hover:underline transition-all duration-200 font-medium whitespace-nowrap"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
