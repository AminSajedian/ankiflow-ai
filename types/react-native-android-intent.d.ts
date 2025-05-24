declare module 'react-native-android-intent' {
  interface IntentResult {
    action: string;
    extras?: Record<string, any>;
  }

  export function sendIntent(
    action: string,
    extras?: Record<string, any>,
    successCallback?: (result: string) => void,
    errorCallback?: (error: string) => void
  ): void;

  export function getIntent(): Promise<IntentResult>;
}