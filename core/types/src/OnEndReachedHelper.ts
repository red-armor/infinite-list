import type Batchinator from '@x-oasis/batchinator';
import type { ScrollMetrics } from './scrollMetrics.types';

export interface IOnEndReachedHelper {
  attemptToHandleOnEndReachedBatchinator: Batchinator;
  /**
   *
   * @param scrollMetrics
   * @param positive
   * @returns
   */
  perform: (
    scrollMetrics?: ScrollMetrics | undefined,
    positive?: boolean
  ) =>
    | {
        distanceFromEnd: number;
        isEndReached: boolean;
      }
    | undefined;
}
