import NetInfo from '@react-native-community/netinfo';

/**
 * Checks if the device is connected to the internet.
 * @returns Promise<boolean> - true if online, false otherwise
 */
export async function checkConnection(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !!state.isConnected && !!state.isInternetReachable;
}
