import defaultBooleanValue from '@x-oasis/default-boolean-value';

// https://github.com/facebook/react-native/blob/main/Libraries/Interaction/Batchinator.js

class Scheduler {
  readonly _delayMS: number;
  private _args: Array<any>;

  private _callback: Function;
  private _taskHandle: {
    cancel: () => void;
  } | null;
  private _leading: boolean;
  private _trailing: boolean;

  constructor(
    cb: Function,
    delayMS: number,
    options?: {
      leading: boolean;
      trailing: boolean;
    }
  ) {
    this._callback = cb;
    this._delayMS = delayMS;
    this._taskHandle = null;
    this._args = [];
    this._leading = defaultBooleanValue(options?.leading, true);
    this._trailing = defaultBooleanValue(options?.trailing, true);
  }

  dispose(
    options: {
      abort: boolean;
    } = {
      abort: false,
    }
  ) {
    const { abort } = options;
    if (this._taskHandle) {
      this._taskHandle.cancel();
      this._taskHandle = null;
    }
    if (typeof this._callback === 'function' && !abort) {
      this._callback(...this._args);
    }
  }

  inSchedule() {
    return !!this._taskHandle;
  }

  flush(...args: any[]) {
    if (args.length) this._args = args;
    if (this._taskHandle) {
      this._taskHandle.cancel();
      this._taskHandle = null;
    }
    this._callback(...this._args);
  }

  schedule(...args: any[]) {
    this._args = args;

    if (this._taskHandle) return;
    const handler = this._leading
      ? () => {
          this._taskHandle = null;
        }
      : () => {
          this._taskHandle = null;
          this._callback(...this._args);
        };

    if (!this._delayMS) {
      handler();
      return;
    }

    if (this._leading) {
      this._callback(...this._args);
    }

    const timeoutHandle = setTimeout(() => {
      handler();
    }, this._delayMS);

    this._taskHandle = { cancel: () => clearTimeout(timeoutHandle) };
  }
}

export default Scheduler;
