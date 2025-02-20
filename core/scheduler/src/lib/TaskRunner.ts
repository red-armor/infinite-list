import defaultBooleanValue from '@x-oasis/default-boolean-value';
import { getNow } from './utils';

class TaskRunner {
  readonly _delayMS: number;
  private _args: Array<any>;

  private _callback: Function;

  readonly _leading: boolean;
  readonly _trailing: boolean;
  private _lastCallTime: number | null = null;
  private _lastInvokeTime: number | null = null;
  private timerId: NodeJS.Timer | null = null;
  private _result: any = null;
  private _hasOverlappedTask: boolean;

  constructor(
    cb: Function,
    delayMS: number,
    options?: {
      leading?: boolean;
      trailing?: boolean;
    }
  ) {
    this._callback = cb;
    this._delayMS = delayMS;
    this._hasOverlappedTask = false;
    this._args = [];
    this._leading = defaultBooleanValue(options?.leading, true);
    this._trailing = defaultBooleanValue(options?.trailing, true);
  }

  dispose(
    options: {
      abort: boolean;
    } = {
      abort: true,
    }
  ) {
    const { abort } = options;
    this.cancel();
    if (typeof this._callback === 'function' && !abort) {
      this._result = this._callback(...this._args);
      return this._result;
    }
  }

  get result() {
    return this._result;
  }

  flush(...args: any[]) {
    if (args.length) this._args = args;
    this.cancel();
    this._lastInvokeTime = null;
    return this.invoke();
  }

  reset() {
    this.timerId = null;
    this._hasOverlappedTask = false;
    this._lastCallTime = null;
  }

  invoke() {
    this._result = this._callback(...this._args);
    return this._result;
  }

  leadingEdge(time: number) {
    /**
     * To record invoke `leadingEdge` time, then in `trailingEdge`
     * can be used to determine whether to invoke `trailingEdge`
     */
    this._lastInvokeTime = time;
    const immediatelyCall = this._leading || !this._delayMS;

    if (immediatelyCall) {
      this.invoke();
    }

    this.timerId = setTimeout(() => {
      if (!immediatelyCall) this.invoke();
      this.trailingEdge();
      /**
       * reset should be called after trailingEdge
       */
      this.reset();
    }, this._delayMS);
  }

  trailingEdge() {
    const now = getNow();
    if (this._lastCallTime && this._lastInvokeTime) {
      const hasAdditionalCall =
        this._lastCallTime > this._lastInvokeTime || this._hasOverlappedTask;

      if (hasAdditionalCall && this._trailing) {
        const remainingTime = this._delayMS - (now - this._lastCallTime);
        this.timerId = setTimeout(() => {
          this.invoke();
          this.reset();
        }, remainingTime);
      }
    }

    this._lastInvokeTime = null;
  }

  shouldInvokeNext() {
    const now = getNow();
    if (!this._lastCallTime) return true;

    const timeSinceLastCall = now - this._lastCallTime;

    if (timeSinceLastCall > this._delayMS) return true;
    return false;
  }

  cancel() {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
    this.reset();
  }

  schedule(...args: any[]) {
    this._args = args;
    const invokeNext = this.shouldInvokeNext();
    const now = getNow();

    /**
     * has consecutive calls, and the trigger time is the same...
     *
     * for example, the first task start on time t1 and finished on t1,
     * then the second task also comes at t1, but its args may changed.
     *
     * on basic condition, it will not be trigger on trailingEdge handler..
     * so we fix this issue by setting `_hasOverlappedTask` to true.
     */
    if (this.timerId && now === this._lastCallTime) {
      this._hasOverlappedTask = true;
    }

    /**
     * _lastCallTime is updated on every schedule invocation. comparing
     * with _lastInvokeTime, it only updates when `leadingEdge` is invoked.
     *
     */
    this._lastCallTime = now;

    if (!invokeNext) return;
    this.leadingEdge(now);
  }
}

export default TaskRunner;
