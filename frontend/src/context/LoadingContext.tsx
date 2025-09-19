import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  message: string;
  subMessage?: string;
  showLoading: (message?: string, subMessage?: string) => void;
  hideLoading: () => void;
  setLoadingMessage: (message: string, subMessage?: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Processing...');
  const [subMessage, setSubMessage] = useState<string | undefined>();

  const showLoading = (newMessage = 'Processing...', newSubMessage?: string) => {
    setMessage(newMessage);
    setSubMessage(newSubMessage);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
    // Reset to defaults when hiding
    setTimeout(() => {
      setMessage('Processing...');
      setSubMessage(undefined);
    }, 300); // Small delay to prevent flashing
  };

  const setLoadingMessage = (newMessage: string, newSubMessage?: string) => {
    setMessage(newMessage);
    setSubMessage(newSubMessage);
  };

  return (
    <LoadingContext.Provider value={{
      isLoading,
      message,
      subMessage,
      showLoading,
      hideLoading,
      setLoadingMessage
    }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export default LoadingContext;
