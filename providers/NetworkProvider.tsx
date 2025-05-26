import { logger } from '@/utils/logger';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
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
      const response = await axios.post('http://127.0.0.1:8765', {
        action: 'version',
        version: 6,
      }, {
        timeout: 3000
      });
      return response.data?.result >= 6;
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      logger.error('AnkiConnect check failed:', message);
      Toast.show({
        type: 'error',
        text1: 'Connection Failed',
        text2: `Error: ${message}`,
        autoHide: false,
        position: 'bottom',
        onPress: () => Toast.hide(),
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
