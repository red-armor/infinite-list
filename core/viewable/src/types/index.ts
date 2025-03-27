export * from './generic.types';
export * from './onEndReachedHelper.types';
export * from './scrollMetrics.types';
export * from './viewable.types';

// @ts-ignore [TODO]
export type ItemMeta<P = any> = {
  getState: any;
  getLayout: any;
};
