class BatchinateLast {
  readonly _delayMS: number;
  private _args: Array<any>;

  private _callback: Function;

  private _clockTime: number;
  private _lastTime: number;
  private _taskHandler: {
    cancel: () => void;
  };

  constructor(cb: Function, delayMS: number) {
    this._callback = cb;
    this._delayMS = delayMS;
    this._taskHandler = null;
    this._args = null;
    this.handler = this.handler.bind(this);
  }

  dispose(
    options: {
      abort: boolean;
    } = {
      abort: false,
    }
  ) {
    const { abort } = options;
    if (this._taskHandler) {
      this._taskHandler.cancel();
      this._taskHandler = null;
    }
    if (typeof this._callback === 'function' && !abort) {
      this._callback.apply(this, this._args); // eslint-disable-line
    }
  }

  inSchedule() {
    return !!this._taskHandler;
  }

  flush(...args) {
    if (args.length) this._args = args;
  }

  handler() {
    if (this._taskHandler) {
      this._taskHandler.cancel();
      this._taskHandler = null;
    }
    this._callback.apply(this, this._args); // eslint-disable-line

    if (this._delayMS && this._clockTime !== this._lastTime) {
      const elapsedTime = Date.now() - this._lastTime;
      const timeoutTime = Math.max(this._delayMS - elapsedTime, 0);
      this._clockTime = Date.now();
      const timeoutHandler = setTimeout(() => {
        this.handler();
      }, timeoutTime);

      this._taskHandler = { cancel: () => clearTimeout(timeoutHandler) };
    }
  }

  schedule(...args) {
    this._args = args;
    const now = Date.now();
    this._lastTime = now;

    if (this._taskHandler) return;

    if (!this._delayMS) {
      this.handler();
      return;
    }

    this._clockTime = now;
    const timeoutHandler = setTimeout(() => {
      this.handler();
    }, this._delayMS);

    this._taskHandler = { cancel: () => clearTimeout(timeoutHandler) };
  }
}

export default BatchinateLast;
