export type OnEndReachedHelperProps = {
  id: string;
  onEndReached?: OnEndReached;
  onEndReachedThreshold?: number;
  onEndReachedTimeoutThreshold?: number;
  distanceFromEndThresholdValue?: number;
  onEndReachedHandlerTimeoutThreshold?: number;
  maxCountOfHandleOnEndReachedAfterStillness?: number;
};

export type OnEndReached = (props: {
  distanceFromEnd: number;
  cb: () => void;
  releaseHandlerMutex?: () => void;
}) => void;

export type SendOnEndReachedDistanceFromBottomStack = Array<{
  distancesFromEnd: Array<number>;
  ts: Array<number>;
  hit: number;
  resetCount: number;
}>;
