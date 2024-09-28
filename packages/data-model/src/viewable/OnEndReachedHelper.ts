import Batchinator from '@x-oasis/batchinator';
import {
  ON_END_REACHED_HANDLER_TIMEOUT_THRESHOLD,
  ON_END_REACHED_THRESHOLD,
  ON_END_REACHED_TIMEOUT_THRESHOLD,
} from '../common';
import {
  OnEndReached,
  OnEndReachedHelperProps,
  ScrollMetrics,
  SendOnEndReachedDistanceFromBottomStack,
} from '../types';
import isClamped from '@x-oasis/is-clamped';

class OnEndReachedHelper {
  readonly id: string;
  readonly onEndReachedThreshold: number;
  readonly onEndReachedTimeoutThreshold: number;
  readonly onEndReachedHandlerTimeoutThreshold: number;
  readonly onEndReachedHandlerBatchinator: Batchinator;
  readonly _consecutiveDistanceTimeoutThresholdValue = 800;
  readonly sendOnEndReachedDistanceFromEndStack: SendOnEndReachedDistanceFromBottomStack;

  private onEndReached: OnEndReached | Array<OnEndReached>;
  private _scrollMetrics?: ScrollMetrics;
  private _maxCountOfHandleOnEndReachedAfterStillness: number;
  private _distanceFromEndThresholdValue: number;
  private _waitingForDataChangedSinceEndReached = false;
  private _onEndReachedTimeoutHandler: NodeJS.Timeout;
  private _currentMutexMS = 0;

  public attemptToHandleOnEndReachedBatchinator: Batchinator;

  constructor(props: OnEndReachedHelperProps) {
    const {
      id,
      onEndReached,
      distanceFromEndThresholdValue = 100,
      maxCountOfHandleOnEndReachedAfterStillness = 3,
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
    this.sendOnEndReachedDistanceFromEndStack = [];
    this._distanceFromEndThresholdValue = distanceFromEndThresholdValue;
    this._maxCountOfHandleOnEndReachedAfterStillness =
      maxCountOfHandleOnEndReachedAfterStillness;

    this.releaseHandlerMutex = this.releaseHandlerMutex.bind(this);
    this.onEndReachedHandlerBatchinator = new Batchinator(
      this.onEndReachedHandler.bind(this),
      50
    );
    this.attemptToHandleOnEndReachedBatchinator = new Batchinator(
      this.attemptToHandleOnEndReached.bind(this),
      50
    );
  }

  static createStackToken(distanceFromEnd: number) {
    return {
      ts: [Date.now()],
      hit: 1,
      distancesFromEnd: [distanceFromEnd],
      resetCount: 0,
    };
  }

  setHandler(onEndReached: OnEndReached) {
    if (
      typeof onEndReached === 'function' &&
      this.onEndReached !== onEndReached
    )
      this.onEndReached = onEndReached;
  }

  hasHandler() {
    return (
      Array.isArray(this.onEndReached) ||
      typeof this.onEndReached === 'function'
    );
  }

  removeHandler(onEndReached: OnEndReached) {
    const next = [].concat(this.onEndReached);
    const index = next.findIndex((handler) => handler === onEndReached);
    if (index !== -1) {
      next.splice(index, 1);
      this.onEndReached = next;
    }
  }

  addHandler(onEndReached: OnEndReached) {
    if (typeof onEndReached === 'function') {
      const handler = Array.isArray(this.onEndReached)
        ? this.onEndReached
        : this.onEndReached
        ? [this.onEndReached]
        : [];
      const index = handler.findIndex((v) => v === onEndReached);
      if (index === -1) handler.push(onEndReached);
      this.onEndReached = handler;
    }

    return () => {
      if (Array.isArray(this.onEndReached)) {
        const index = this.onEndReached.findIndex((v) => v === onEndReached);
        if (index !== -1) this.onEndReached.splice(index, 1);
      }
    };
  }

  /**
   *
   * @param scrollMetrics
   * @param positive
   * @returns
   */
  perform(
    scrollMetrics: ScrollMetrics = this._scrollMetrics,
    positive = false
  ) {
    const { contentLength, offset, visibleLength } = scrollMetrics;
    const distanceFromEnd = contentLength - visibleLength - offset;
    const threshold = this.onEndReachedThreshold * visibleLength;
    this._scrollMetrics = scrollMetrics;

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

  attemptToHandleOnEndReached() {
    const { isEndReached, distanceFromEnd } = this._scrollMetrics
      ? this.perform(this._scrollMetrics)
      : {
          distanceFromEnd: 0,
          isEndReached: true,
        };
    this.performEndReached({ isEndReached, distanceFromEnd });
  }

  clearTimer() {
    if (this._onEndReachedTimeoutHandler) {
      clearTimeout(this._onEndReachedTimeoutHandler);
    }
    this._onEndReachedTimeoutHandler = null;
  }

  releaseHandlerMutex(mutexMS: number) {
    return (() => {
      if (mutexMS < this._currentMutexMS) return;
      this._waitingForDataChangedSinceEndReached = false;
      this.clearTimer();
    }).bind(this);
  }

  timeoutReleaseHandlerMutex(now) {
    console.warn(
      'OnEndReachedHelper ',
      this.id,
      now,
      Date.now() - now,
      this.lastStack,
      "' mutex is released due to timeout"
    );
    this.releaseHandlerMutex(now).call(this);
  }

  get lastStack() {
    return this.sendOnEndReachedDistanceFromEndStack[
      this.sendOnEndReachedDistanceFromEndStack.length - 1
    ];
  }

  getStack() {
    return this.sendOnEndReachedDistanceFromEndStack;
  }

  reachCountLimitation() {
    if (!this.lastStack) return false;
    if (this.lastStack.hit >= this._maxCountOfHandleOnEndReachedAfterStillness)
      return true;
    return false;
  }

  shouldResetCountLimitation(distanceFromEnd: number) {
    const { distancesFromEnd } = this.lastStack;
    const distance = distancesFromEnd[distancesFromEnd.length - 1];
    if (distanceFromEnd <= 0) return false;
    if (distance !== distanceFromEnd) {
      this.lastStack.resetCount += 1;
      this.lastStack.hit = 1;
      return true;
    }
    return false;
  }

  isConsecutiveDistance(distanceFromEnd: number) {
    const lastStack =
      this.sendOnEndReachedDistanceFromEndStack[
        this.sendOnEndReachedDistanceFromEndStack.length - 1
      ];

    if (lastStack) {
      const { distancesFromEnd, ts } = lastStack;

      const base = distancesFromEnd[0];
      const _ts = ts[ts.length - 1];
      const now = Date.now();
      if (
        isClamped(
          base - this._distanceFromEndThresholdValue,
          distanceFromEnd,
          base + this._distanceFromEndThresholdValue
        ) &&
        now - _ts < this._consecutiveDistanceTimeoutThresholdValue
      ) {
        return true;
      }
    }

    return false;
  }

  performEndReached(info: { isEndReached: boolean; distanceFromEnd: number }) {
    if (this._waitingForDataChangedSinceEndReached) return;
    const { isEndReached, distanceFromEnd } = info;

    if (!this.hasHandler()) return;
    if (isEndReached && !this.isConsecutiveDistance(distanceFromEnd)) {
      if (
        !this.reachCountLimitation() ||
        this.shouldResetCountLimitation(distanceFromEnd)
      ) {
        this.onEndReachedHandlerBatchinator.schedule({
          distanceFromEnd,
        });
      }
    }
  }

  updateStack(distanceFromEnd: number) {
    const lastStack =
      this.sendOnEndReachedDistanceFromEndStack[
        this.sendOnEndReachedDistanceFromEndStack.length - 1
      ];

    if (lastStack) {
      const { distancesFromEnd } = lastStack;
      const stackDistanceFromEnd = distancesFromEnd[0];

      if (
        isClamped(
          stackDistanceFromEnd - this._distanceFromEndThresholdValue,
          distanceFromEnd,
          stackDistanceFromEnd + this._distanceFromEndThresholdValue
        )
      ) {
        lastStack.distancesFromEnd.push(distanceFromEnd);
        lastStack.hit += 1;
        lastStack.ts.push(Date.now());
        return;
      }
    }

    this.sendOnEndReachedDistanceFromEndStack.push(
      OnEndReachedHelper.createStackToken(distanceFromEnd)
    );
  }

  timeoutTrailingHandler() {
    if (this._scrollMetrics) {
      const info = this.perform(this._scrollMetrics);
      this.performEndReached(info);
    }
  }

  onEndReachedHandler(opts: { distanceFromEnd: number }) {
    if (!this.hasHandler()) return;
    if (this._waitingForDataChangedSinceEndReached) return;
    this._waitingForDataChangedSinceEndReached = true;
    const { distanceFromEnd } = opts;
    this.clearTimer();
    const now = Date.now();
    this._onEndReachedTimeoutHandler = setTimeout(() => {
      this.timeoutReleaseHandlerMutex(now);
      this.timeoutTrailingHandler();
    }, this.onEndReachedHandlerTimeoutThreshold);
    this._currentMutexMS = now;

    this.updateStack(distanceFromEnd);

    if (Array.isArray(this.onEndReached)) {
      this.onEndReached.forEach((handler) => {
        handler({
          distanceFromEnd,
          cb: this.releaseHandlerMutex(this._currentMutexMS),
          releaseHandlerMutex: this.releaseHandlerMutex(this._currentMutexMS),
        });
      });
    } else {
      this.onEndReached({
        distanceFromEnd,
        cb: this.releaseHandlerMutex(this._currentMutexMS),
        releaseHandlerMutex: this.releaseHandlerMutex(this._currentMutexMS),
      });
    }
  }
}

export default OnEndReachedHelper;
