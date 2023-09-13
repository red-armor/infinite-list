import ListBaseDimensions from '../ListBaseDimensions';

export type RecyclerProps = {
  recyclerTypes: Array<string>;
  recyclerBufferSize: number;
  thresholdIndexValue: number;
  recyclerReservedBufferPerBatch: number;
  owner: ListBaseDimensions;
};

export type SafeRange = {
  startIndex: number;
  endIndex: number;
};
