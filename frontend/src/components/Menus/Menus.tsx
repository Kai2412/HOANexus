import React from 'react';

interface MenusProps {
  onOverlayNavigation?: (overlay: 'directory' | 'forms' | 'tickets' | 'reports' | 'settings' | 'admin', params?: Record<string, any>) => void;
}

const Menus: React.FC<MenusProps> = ({ onOverlayNavigation }) => {
  const handleButtonClick = (overlay: 'directory' | 'forms' | 'tickets' | 'reports' | 'admin') => {
    if (!onOverlayNavigation) return;
    
    switch (overlay) {
      case 'directory':
        onOverlayNavigation('directory', { view: 'lookup' });
        break;
      case 'forms':
        onOverlayNavigation('forms', { view: 'categories' });
        break;
      case 'tickets':
        onOverlayNavigation('tickets', {});
        break;
      case 'reports':
        onOverlayNavigation('reports', {});
        break;
      case 'admin':
        onOverlayNavigation('admin', {});
        break;
    }
  };

  return (
    <div className="h-full p-4 flex items-center">
      <div className="flex gap-4">
        
        {/* Directory Button */}
        <button 
          className="bg-royal-600 hover:bg-royal-700 text-white px-4 py-2 rounded-lg transition-colors theme-transition"
          onClick={() => handleButtonClick('directory')}
        >
          Directory
        </button>

        {/* Forms Button */}
        <button 
          className="bg-royal-600 hover:bg-royal-700 text-white px-4 py-2 rounded-lg transition-colors theme-transition"
          onClick={() => handleButtonClick('forms')}
        >
          Forms
        </button>

        {/* My Tickets Button */}
        <button 
          className="bg-royal-600 hover:bg-royal-700 text-white px-4 py-2 rounded-lg transition-colors theme-transition"
          onClick={() => handleButtonClick('tickets')}
        >
          My Tickets
        </button>

        {/* Reports Button */}
        <button 
          className="bg-royal-600 hover:bg-royal-700 text-white px-4 py-2 rounded-lg transition-colors theme-transition"
          onClick={() => handleButtonClick('reports')}
        >
          Reports
        </button>

        {/* Admin Button */}
        <button 
          className="bg-royal-600 hover:bg-royal-700 text-white px-4 py-2 rounded-lg transition-colors theme-transition"
          onClick={() => handleButtonClick('admin')}
        >
          Admin
        </button>

        
      </div>
    </div>
  );
};

export default Menus;
