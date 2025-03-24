export const info = (...args: any[]) => {
  // console.info(...args);

  // @ts-expect-error
  if (process.env.NODE_ENV === 'verbose') console.info(...args);
};

export default {
  info,
};
