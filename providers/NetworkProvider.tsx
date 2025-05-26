import { logger } from '@/utils/logger';
import NetInfo from '@react-native-community/netinfo';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';

interface NetworkContextValue {
  isConnected: boolean;
  checkConnections: () => Promise<{ isOnline: boolean; hasAnkiConnect: boolean }>;
}

const NetworkContext = createContext<NetworkContextValue>({
  isConnected: false,
  checkConnections: async () => ({ isOnline: false, hasAnkiConnect: false }),
});

const ANKICONNECT_URL = 'http://127.0.0.1:8765';

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const isCheckingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const lastCheck = useRef<{ time: number; result: { isOnline: boolean; hasAnkiConnect: boolean } } | null>(null);

  const checkAnkiConnect = async () => {
    // Skip if another check is in progress
    if (isCheckingRef.current) {
      logger.debug('Check AnkiConnect Connection already in progress, skipping');
      return lastCheck.current?.result.hasAnkiConnect ?? false;
    }

    // Use cached result if available and not first check
    if (isInitializedRef.current && lastCheck.current && Date.now() - lastCheck.current.time < 10000) {
      logger.debug('Using cached AnkiConnect check result');
      return lastCheck.current.result.hasAnkiConnect;
    }

    try {
      isCheckingRef.current = true;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      logger.debug(isInitializedRef.current ? 'Performing new AnkiConnect check' : 'Initial AnkiConnect check');
      const response = await fetch(ANKICONNECT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'version', version: 6 }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      
      return data?.result >= 6;
    } catch (error: any) {
      logger.debug('AnkiConnect check failed:', error.message);
      return false;
    } finally {
      isCheckingRef.current = false;
    }
  };

  const checkConnections = useCallback(async () => {
    // Skip if another check is in progress
    if (isCheckingRef.current) {
      logger.debug('Check already in progress, returning last result');
      return lastCheck.current?.result ?? { isOnline: false, hasAnkiConnect: false };
    }

    // Use cached result if available and not first check
    if (isInitializedRef.current && lastCheck.current && Date.now() - lastCheck.current.time < 10000) {
      logger.debug('Using cached connection check result');
      return lastCheck.current.result;
    }

    try {
      isCheckingRef.current = true;
      const state = await NetInfo.fetch();
      const isOnline = !!state.isConnected;
      setIsConnected(isOnline);

      const result = {
        isOnline,
        hasAnkiConnect: isOnline ? await checkAnkiConnect() : false
      };

      lastCheck.current = {
        time: Date.now(),
        result
      };

      // Only show errors after initialization
      if (!isInitializedRef.current && (!result.isOnline || !result.hasAnkiConnect)) {
        Toast.show({
          type: 'error',
          text1: !result.isOnline ? 'Network Unavailable' : 'AnkiConnect Unavailable',
          text2: !result.isOnline 
            ? 'Check your internet connection'
            : '1. Install AnkiConnect Android\n2. Start the app\n3. Try again',
          autoHide: false,
          position: 'bottom',
        });
      }

      return result;
    } finally {
      isCheckingRef.current = false;
      isInitializedRef.current = true;
    }
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
