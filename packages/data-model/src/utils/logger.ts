export const info = (...args: any[]) => {
  // @ts-expect-error
  if (process.env.NODE_ENV === 'verbose') console.info(...args);
};
