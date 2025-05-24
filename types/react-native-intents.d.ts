declare module 'react-native-intents' {
  interface IntentResult {
    data?: string;
    extras?: Record<string, any>;
  }

  namespace Intents {
    function sendIntent(action: string, extras?: Record<string, any>): Promise<IntentResult>;
  }

  export default Intents;
}
