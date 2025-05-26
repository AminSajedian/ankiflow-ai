const LOG_TAG = 'AnkiFlowAI';

export const logger = {
  debug: (...args: any[]) => {
    console.debug(`${LOG_TAG}:`, ...args);
  },
  log: (...args: any[]) => {
    console.log(`${LOG_TAG}:`, ...args);
  },
  warn: (...args: any[]) => {
    console.warn(`${LOG_TAG}:`, ...args);
  },
  error: (...args: any[]) => {
    console.error(`${LOG_TAG}:`, ...args);
  }
};
