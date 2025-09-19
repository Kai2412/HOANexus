import React, { useState, useEffect } from 'react'
import { CommunityProvider, ThemeProvider, LoadingProvider, AuthProvider, useCommunity, useLoading, useAuth } from './context'
import CommunitySelector from './components/CommunitySelector'
import Header from './components/Header'
import Menus from './components/Menus'
import InformationContainer from './components/InformationContainer'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingOverlay from './components/LoadingOverlay'
import Login from './components/Login'

function AppContent() {
  const { communities, selectedCommunity, selectCommunity, loading, error } = useCommunity()
  const { isLoading, message, subMessage } = useLoading()
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const [isCommunitySelectorExpanded, setIsCommunitySelectorExpanded] = useState(false)
  const [currentOverlay, setCurrentOverlay] = useState<'directory' | 'forms' | 'tickets' | 'reports' | 'settings' | null>(null)
  const [overlayParams, setOverlayParams] = useState<Record<string, any>>({})
  
  const toggleCommunitySelector = () => {
    setIsCommunitySelectorExpanded(!isCommunitySelectorExpanded)
  }

  const handleOverlayNavigation = (overlay: 'directory' | 'forms' | 'tickets' | 'reports' | 'settings', params: Record<string, any> = {}) => {
    setCurrentOverlay(overlay)
    setOverlayParams(params)
    
    // Auto-expand community selector when entering forms (desktop only)
    if (overlay === 'forms') {
      const isDesktop = window.innerWidth >= 768; // md breakpoint
      if (isDesktop) {
        setIsCommunitySelectorExpanded(true)
      }
    }
  }

  const handleCloseOverlay = () => {
    setCurrentOverlay(null)
    setOverlayParams({})
  }

  // Listen for overlay close events
  useEffect(() => {
    const handleOverlayClose = () => {
      handleCloseOverlay()
    }

    window.addEventListener('overlay:close', handleOverlayClose)
    return () => {
      window.removeEventListener('overlay:close', handleOverlayClose)
    }
  }, [])

  // Listen for auth events to reset app state
  useEffect(() => {
    const handleAuthLogin = () => {
      // Reset to fresh state on login
      setCurrentOverlay(null);
      setOverlayParams({});
      setIsCommunitySelectorExpanded(false);
    };

    const handleAuthLogout = () => {
      // Reset to fresh state on logout
      setCurrentOverlay(null);
      setOverlayParams({});
      setIsCommunitySelectorExpanded(false);
    };

    const handleNavigateToForms = (event: any) => {
      // Navigate to forms overlay with specific form
      const formName = event.detail?.form;
      handleOverlayNavigation('forms', { view: 'form', form: formName });
    };

    const handleOverlayNavigate = (event: any) => {
      // Navigate to a different overlay
      const overlayName = event.detail?.overlay;
      if (overlayName) {
        setCurrentOverlay(overlayName);
        setOverlayParams({});
      }
    };

    window.addEventListener('auth:login', handleAuthLogin);
    window.addEventListener('auth:logout', handleAuthLogout);
    window.addEventListener('navigate:forms', handleNavigateToForms);
    window.addEventListener('overlay:navigate', handleOverlayNavigate);
    
    return () => {
      window.removeEventListener('auth:login', handleAuthLogin);
      window.removeEventListener('auth:logout', handleAuthLogout);
      window.removeEventListener('navigate:forms', handleNavigateToForms);
      window.removeEventListener('overlay:navigate', handleOverlayNavigate);
    };
  }, [])

  const handleLogout = () => {
    logout();
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  if (loading || authLoading) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-surface theme-transition">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-600 mb-4"></div>
        <div className="text-xl text-primary">Loading communities...</div>
      </div>
    )
  }

  if (error && communities.length === 0) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-surface p-6 theme-transition">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 max-w-2xl theme-transition">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-red-800 dark:text-red-200 font-semibold">Error Loading Communities</h2>
          </div>
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
        <div className="text-center text-secondary">
          <p className="mb-2">Make sure your API server is running on:</p>
          <code className="bg-surface-secondary px-3 py-1 rounded text-sm text-primary">
            {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}
          </code>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-surface theme-transition overflow-hidden">
      {/* Header - No community selector here */}
      <Header onLogout={handleLogout} />

      {/* Error warning if communities loaded with errors */}
      {error && communities.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 p-3 mx-4 mt-2 rounded theme-transition">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-yellow-800 dark:text-yellow-200">{error}</span>
          </div>
        </div>
      )}

      {/* Main Grid Layout - Exactly like original */}
      <div 
        className={`flex-1 grid gap-0 ${
          isCommunitySelectorExpanded 
            ? 'grid-cols-[350px_10px_1fr] grid-rows-[auto_10px_1fr]'
            : 'grid-cols-[350px_10px_1fr] grid-rows-[auto_10px_1fr]'
        }`}
        style={{
          gridTemplateAreas: isCommunitySelectorExpanded 
            ? '"community gap1 menu" "community gap1 gap2" "community gap1 information"'
            : '"community gap1 menu" "gap2 gap2 gap2" "information information information"'
        }}
      >
        
        {/* Left Panel - Community Selector (350px width) */}
        <div 
          className="bg-surface border-r border-primary theme-transition overflow-x-hidden"
          style={{ gridArea: 'community' }}
        >
          <CommunitySelector 
            communities={communities}
            selectedCommunity={selectedCommunity}
            onCommunityChange={selectCommunity}
            mode={isCommunitySelectorExpanded ? 'list' : 'search'}
            onToggle={toggleCommunitySelector}
          />
        </div>

        {/* Top Right - Menu Dropdowns */}
        <div 
          className="bg-surface-secondary border-b border-primary theme-transition"
          style={{ gridArea: 'menu' }}
        >
          <Menus onOverlayNavigation={handleOverlayNavigation} />
        </div>

        {/* Bottom Right - Information Container */}
        <div 
          className="bg-surface theme-transition"
          style={{ gridArea: 'information' }}
        >
          <InformationContainer 
            selectedCommunity={selectedCommunity} 
            currentOverlay={currentOverlay}
            overlayParams={overlayParams}
          />
        </div>
        
      </div>

      {/* Global Loading Overlay */}
      <LoadingOverlay 
        isVisible={isLoading} 
        message={message} 
        subMessage={subMessage} 
      />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LoadingProvider>
          <AuthProvider>
            <CommunityProvider>
              <AppContent />
            </CommunityProvider>
          </AuthProvider>
        </LoadingProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
