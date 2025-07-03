export const logger = {
  info: (...args: unknown[]) => console.log(...args),
  debug: (...args: unknown[]) => console.debug(...args),
  error: (...args: unknown[]) => console.error(...args),
};
