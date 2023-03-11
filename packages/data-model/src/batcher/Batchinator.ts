// import { InteractionManager } from 'react-native';

// https://github.com/facebook/react-native/blob/main/Libraries/Interaction/Batchinator.js

class Batchinator {
  readonly _delayMS: number;
  private _args: Array<any>;

  private _callback: Function;
  private _taskHandle: {
    cancel: () => void;
  };

  constructor(cb: Function, delayMS: number) {
    this._callback = cb;
    this._delayMS = delayMS;
    this._taskHandle = null;
    this._args = null;
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
      this._callback.apply(this, this._args);
    }
  }

  inSchedule() {
    return !!this._taskHandle;
  }

  schedule(...args) {
    this._args = args;

    if (this._taskHandle) return;
    const handler = () => {
      Promise.resolve().then(() => {
        this._taskHandle = null;
        this._callback.apply(this, this._args);
      });
    };

    if (!this._delayMS) {
      handler();
      return;
    }

    const timeoutHandle = setTimeout(() => {
      handler();
    }, this._delayMS);

    this._taskHandle = { cancel: () => clearTimeout(timeoutHandle) };
  }
}

export default Batchinator;
