export const info = (...args: any[]) => {
  // console.info(...args);

  // @ts-expect-error - process.env.NODE_ENV type checking issue
  if (process.env.NODE_ENV === 'verbose') console.info(...args);
};

export default {
  info,
};
