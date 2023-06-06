export type OnEndReachedHelperProps = {
  id: string;
  onEndReached?: OnEndReached;
  onEndReachedThreshold?: number;
  onEndReachedTimeoutThreshold?: number;
  onEndReachedHandlerTimeoutThreshold?: number;
};

export type OnEndReached = (props: {
  distanceFromEnd: number;
  cb: Function;
  releaseHandlerMutex?: Function;
}) => void;
