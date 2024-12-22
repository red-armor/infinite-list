import Batchinator from '@x-oasis/batchinator';
import { ScrollMetrics } from './scrollMetrics.types';

export interface IOnEndReachedHelper {
  attemptToHandleOnEndReachedBatchinator: Batchinator;
  /**
   *
   * @param scrollMetrics
   * @param positive
   * @returns
   */
  perform(
    scrollMetrics?: ScrollMetrics | undefined,
    positive?: boolean
  ):
    | {
        distanceFromEnd: number;
        isEndReached: boolean;
      }
    | undefined;
}
