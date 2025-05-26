import { logger } from '@/utils/logger';
import NetInfo from '@react-native-community/netinfo';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

interface NetworkContextValue {
  isConnected: boolean;
  checkConnections: () => Promise<{ isOnline: boolean; hasAnkiConnect: boolean }>;
}

const NetworkContext = createContext<NetworkContextValue>({
  isConnected: false,
  checkConnections: async () => ({ isOnline: false, hasAnkiConnect: false }),
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);

  const checkAnkiConnect = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('http://127.0.0.1:8765', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'version',
          version: 6
        }),
        signal: controller.signal,
      }).catch((err) => {
        throw new Error(err.message || 'Failed to connect to AnkiConnect');
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (!data || typeof data.result === 'undefined') {
        throw new Error('Invalid response from AnkiConnect');
      }

      return true;
    } catch (error: any) {
      const errorMessage = error.name === 'AbortError' 
        ? 'Connection timed out'
        : error.message === 'Network request failed'
          ? 'Could not connect to AnkiConnect.\nMake sure the app is running.'
          : error.message;

      Toast.show({
        type: 'error',
        text1: 'AnkiConnect Error',
        text2: errorMessage,
        autoHide: false,
        position: 'bottom',
        onPress: () => Toast.hide(),
      });
      
      logger.error('AnkiConnect check failed:', {
        error: errorMessage,
        details: error
      });
      return false;
    }
  };

  const checkConnections = useCallback(async () => {
    const state = await NetInfo.fetch();
    const isOnline = !!state.isConnected;
    setIsConnected(isOnline);

    if (!isOnline) {
      Toast.show({
        type: 'error',
        text1: 'Network Unavailable',
        text2: 'Check your internet connection',
        autoHide: false,
        position: 'bottom',
      });
      return { isOnline, hasAnkiConnect: false };
    }

    const hasAnkiConnect = await checkAnkiConnect();
    if (!hasAnkiConnect) {
      Toast.show({
        type: 'error',
        text1: 'AnkiConnect Unavailable',
        text2: '1. Install AnkiConnect Android\n2. Start the app\n3. Try again',
        autoHide: false,
        position: 'bottom',
      });
    }

    return { isOnline, hasAnkiConnect };
  }, []);

  useEffect(() => {
    checkConnections();
    const unsubscribe = NetInfo.addEventListener(() => {
      checkConnections();
    });
    return () => unsubscribe();
  }, [checkConnections]);

  return (
    <NetworkContext.Provider value={{ isConnected, checkConnections }}>
      {children}
    </NetworkContext.Provider>
  );
}

export const useNetwork = () => useContext(NetworkContext);
