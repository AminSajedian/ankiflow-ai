import { logger } from '@/utils/logger';
import NetInfo from '@react-native-community/netinfo';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

interface NetworkContextValue {
  isConnected: boolean;
  checkConnections: () => Promise<{ isOnline: boolean; hasAnkiConnect: boolean }>;
}

const NetworkContext = createContext<NetworkContextValue>({
  isConnected: false,
  checkConnections: async () => ({ isOnline: false, hasAnkiConnect: false }),
});

const getAnkiConnectUrl = () => {
  if (Platform.OS === 'android') {
    // Try different IP addresses in standalone build
    const urls = [
      'http://127.0.0.1:8765',
      'http://10.0.2.2:8765',
      'http://localhost:8765'
    ];
    return urls;
  }
  return ['http://127.0.0.1:8765'];
};

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);

  const checkAnkiConnect = async () => {
    const urls = getAnkiConnectUrl();
    
    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        logger.debug(`Trying AnkiConnect at: ${url}`);
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'version',
            version: 6
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const data = await response.json();
        
        if (data?.result >= 6) {
          logger.debug(`Connected to AnkiConnect at: ${url}`);
          return true;
        }
      } catch (error: any) {
        logger.debug(`Failed to connect to ${url}:`, error.message);
        continue;
      }
    }

    Toast.show({
      type: 'error',
      text1: 'AnkiConnect Not Available',
      text2: 'Please ensure:\n1. AnkiConnect Android is running\n2. Port 8765 is accessible',
      autoHide: false,
      position: 'bottom',
      onPress: () => Toast.hide(),
    });
    
    return false;
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
