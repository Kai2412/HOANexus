import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { DataService } from '../services';
import type { Community } from '../types';

interface CommunityContextType {
  communities: Community[];
  selectedCommunity: Community | null;
  loading: boolean;
  error: string | null;
  selectCommunity: (community: Community) => void;
  refreshCommunities: () => Promise<void>;
  updateSelectedCommunity: (updatedCommunity: Community) => void;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

interface CommunityProviderProps {
  children: ReactNode;
}

export const CommunityProvider: React.FC<CommunityProviderProps> = ({ children }) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DataService.getCommunities();
      
      // Sort communities alphabetically by displayName (or name as fallback)
      const sortedData = data.sort((a, b) => {
        const nameA = (a.displayName || a.name || '').toLowerCase();
        const nameB = (b.displayName || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      setCommunities(sortedData);
      
      // Auto-select first community if none selected
      if (!selectedCommunity && sortedData.length > 0) {
        setSelectedCommunity(sortedData[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  const selectCommunity = (community: Community) => {
    setSelectedCommunity(community);
    // Optionally store in localStorage for persistence
    localStorage.setItem('selectedCommunity', JSON.stringify(community));
  };

  const refreshCommunities = async () => {
    await fetchCommunities();
  };

  const updateSelectedCommunity = (updatedCommunity: Community) => {
    setSelectedCommunity(updatedCommunity);
    // Update localStorage with the new data
    localStorage.setItem('selectedCommunity', JSON.stringify(updatedCommunity));
    
    // Also update the community in the communities list
    setCommunities(prevCommunities => 
      prevCommunities.map(community => 
        community.id === updatedCommunity.id ? updatedCommunity : community
      )
    );
  };

  const resetToFirstCommunity = () => {
    if (communities.length > 0) {
      setSelectedCommunity(communities[0]);
      localStorage.setItem('selectedCommunity', JSON.stringify(communities[0]));
    }
  };

  useEffect(() => {
    // Check for previously selected community in localStorage
    const savedCommunity = localStorage.getItem('selectedCommunity');
    if (savedCommunity) {
      try {
        setSelectedCommunity(JSON.parse(savedCommunity));
      } catch (e) {
        // If parsing fails, just ignore the saved community
      }
    }

    fetchCommunities();
  }, []);

  // Listen for auth events to reset community selection
  useEffect(() => {
    const handleAuthLogin = () => {
      // Reset to first community on login for fresh experience
      resetToFirstCommunity();
    };

    const handleAuthLogout = () => {
      // Clear community selection on logout
      setSelectedCommunity(null);
      localStorage.removeItem('selectedCommunity');
    };

    window.addEventListener('auth:login', handleAuthLogin);
    window.addEventListener('auth:logout', handleAuthLogout);
    
    return () => {
      window.removeEventListener('auth:login', handleAuthLogin);
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, [communities]);

  const value: CommunityContextType = {
    communities,
    selectedCommunity,
    loading,
    error,
    selectCommunity,
    refreshCommunities,
    updateSelectedCommunity,
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = (): CommunityContextType => {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
};
