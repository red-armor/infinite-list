import Batchinator from '@x-oasis/batchinator';
import {
  ON_END_REACHED_HANDLER_TIMEOUT_THRESHOLD,
  ON_END_REACHED_THRESHOLD,
  ON_END_REACHED_TIMEOUT_THRESHOLD,
} from '../common';
import { OnEndReached, OnEndReachedHelperProps, ScrollMetrics } from '../types';

class OnEndReachedHelper {
  readonly id: string;
  readonly onEndReachedThreshold: number;
  readonly onEndReachedTimeoutThreshold: number;
  readonly onEndReachedHandlerTimeoutThreshold: number;
  readonly onEndReachedHandlerBatchinator: Batchinator;

  private onEndReached: OnEndReached;
  private _waitingForDataChangedSinceEndReached = false;
  private _onEndReachedTimeoutHandler: NodeJS.Timeout;

  constructor(props: OnEndReachedHelperProps) {
    const {
      id,
      onEndReached,
      onEndReachedThreshold = ON_END_REACHED_THRESHOLD,
      onEndReachedTimeoutThreshold = ON_END_REACHED_TIMEOUT_THRESHOLD,
      onEndReachedHandlerTimeoutThreshold = ON_END_REACHED_HANDLER_TIMEOUT_THRESHOLD,
    } = props;

    this.id = id;
    this.onEndReached = onEndReached;
    this.onEndReachedThreshold = onEndReachedThreshold;
    this.onEndReachedTimeoutThreshold = onEndReachedTimeoutThreshold;
    this.onEndReachedHandlerTimeoutThreshold =
      onEndReachedHandlerTimeoutThreshold;

    this.releaseHandlerMutex = this.releaseHandlerMutex.bind(this);
    this.onEndReachedHandlerBatchinator = new Batchinator(
      this.onEndReachedHandler.bind(this),
      50
    );
  }

  clear() {
    this.releaseHandlerMutex();
  }

  setHandler(onEndReached: OnEndReached) {
    if (
      typeof onEndReached === 'function' &&
      this.onEndReached !== onEndReached
    )
      this.onEndReached = onEndReached;
  }

  /**
   *
   * @param scrollMetrics
   * @param positive
   * @returns
   */
  perform(scrollMetrics: ScrollMetrics, positive = false) {
    const { contentLength, offset, visibleLength } = scrollMetrics;
    const distanceFromEnd = contentLength - visibleLength - offset;
    const threshold = this.onEndReachedThreshold * visibleLength;

    if (positive && distanceFromEnd < 0) {
      return {
        distanceFromEnd,
        isEndReached: false,
      };
    }

    return {
      distanceFromEnd,
      isEndReached: distanceFromEnd < threshold,
    };
  }

  clearTimer() {
    if (this._onEndReachedTimeoutHandler) {
      clearTimeout(this._onEndReachedTimeoutHandler);
    }
    this._onEndReachedTimeoutHandler = null;
  }

  releaseHandlerMutex() {
    this._waitingForDataChangedSinceEndReached = false;
    this.clearTimer();
  }

  performEndReached(info: { isEndReached: boolean; distanceFromEnd: number }) {
    console.log(
      'perform end ',
      this.id,
      this._waitingForDataChangedSinceEndReached
    );
    console.log(
      '[onEndReachedHelper] performEndReached ',
      this.id,
      this._waitingForDataChangedSinceEndReached
    );
    if (this._waitingForDataChangedSinceEndReached) return;
    const { isEndReached, distanceFromEnd } = info;

    if (typeof this.onEndReached !== 'function') return;
    if (isEndReached) {
      this._waitingForDataChangedSinceEndReached = true;
      this.onEndReachedHandlerBatchinator.schedule({
        distanceFromEnd,
      });
    }
  }

  onEndReachedHandler(opts: { distanceFromEnd: number }) {
    if (typeof this.onEndReached !== 'function') return;
    this._waitingForDataChangedSinceEndReached = true;
    const { distanceFromEnd } = opts;
    this.clearTimer();
    this._onEndReachedTimeoutHandler = setTimeout(() => {
      this._waitingForDataChangedSinceEndReached = false;
    }, this.onEndReachedHandlerTimeoutThreshold);
    console.log('[onEndReachedHelper] onEndReachedHandler ', this.id);

    this.onEndReached({
      distanceFromEnd,
      cb: this.releaseHandlerMutex,
      releaseHandlerMutex: this.releaseHandlerMutex,
    });
  }
}

export default OnEndReachedHelper;
