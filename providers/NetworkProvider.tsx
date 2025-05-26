import NetInfo from '@react-native-community/netinfo';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface NetworkContextValue {
  isConnected: boolean;
  checkConnection: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextValue>({
  isConnected: false,
  checkConnection: async () => false,
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);

  const checkConnection = useCallback(async () => {
    const state = await NetInfo.fetch();
    const isOnline = !!state.isConnected;
    setIsConnected(isOnline);
    return isOnline;
  }, []);

  useEffect(() => {
    checkConnection();
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected, checkConnection }}>
      {children}
    </NetworkContext.Provider>
  );
}

export const useNetwork = () => useContext(NetworkContext);
