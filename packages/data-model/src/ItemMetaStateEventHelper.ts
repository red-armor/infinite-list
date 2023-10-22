import Batchinator from '@x-oasis/batchinator';
import defaultBooleanValue from '@x-oasis/default-boolean-value';
import noop from '@x-oasis/noop';
import getMapKeyByValue from '@x-oasis/get-map-key-by-value';
import { StateEventListener, ItemMetaStateEventHelperProps } from './types';

let canIUseRIC = false;
let finished = false;

setTimeout(() => {
  if (finished) return;
  canIUseRIC = false;
  finished = true;
});

// function requestIdleCallback(cb) {
//   setTimeout(cb, 0);
// }

interface IdleRequestCallback {
  (deadline: IdleDeadline): void;
}
/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/IdleDeadline) */
interface IdleDeadline {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/IdleDeadline/didTimeout) */
  readonly didTimeout: boolean;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/IdleDeadline/timeRemaining) */
  timeRemaining(): DOMHighResTimeStamp;
}
interface IdleRequestOptions {
  timeout?: number;
}

// declare function requestIdleCallback(
//   callback: IdleRequestCallback,
//   options?: IdleRequestOptions
// ): number;

// requestIdleCallback(() => {
//   canIUseRIC = true;
//   finished = true;
// });

class ItemMetaStateEventHelper {
  private _batchUpdateEnabled: boolean;
  private _value = false;
  readonly _eventName: string;

  private _strictListeners: Array<StateEventListener>;

  private _listeners: Array<StateEventListener> = [];
  private _handleCountMap: Map<StateEventListener, number>;

  private _triggerBatchinator: Batchinator;
  private _once: boolean;
  readonly _key: string;
  private _reusableEventListenerMap: Map<string, StateEventListener>;
  private _reusableStrictEventListenerMap: Map<string, StateEventListener>;
  private _callbackId: number;
  private _callbackStartMinMs: number;
  readonly _canIUseRIC: boolean;
  private _strictListenerKeyToHandleCountMap: {
    [key: string]: number;
  };

  constructor(props: ItemMetaStateEventHelperProps) {
    const {
      key,
      eventName,
      batchUpdateEnabled,
      defaultValue = false,
      canIUseRIC: _canIUseRIC,
      once,
      strictListenerKeyToHandleCountMap = {},
    } = props;

    this._key = key;
    this._eventName = eventName;
    this._reusableEventListenerMap = new Map();
    this._reusableStrictEventListenerMap = new Map();
    this._batchUpdateEnabled =
      typeof batchUpdateEnabled === 'boolean'
        ? batchUpdateEnabled
        : eventName === 'viewable'
        ? false
        : true;
    this._once =
      typeof once === 'boolean'
        ? once
        : eventName === 'impression'
        ? true
        : false;

    this._strictListenerKeyToHandleCountMap = strictListenerKeyToHandleCountMap;
    this._triggerBatchinator = new Batchinator(this._trigger.bind(this), 50);
    this.remover = this.remover.bind(this);
    this._handleCountMap = new Map();
    this._strictListeners = [];
    // ric in RN can not be triggered. https://github.com/facebook/react-native/issues/28602
    this._canIUseRIC = defaultBooleanValue(_canIUseRIC, canIUseRIC);

    if (defaultValue) {
      this.trigger(defaultValue);
    }
  }

  static spawn(ins: ItemMetaStateEventHelper) {
    const strictListenerKeyToHandleCountMap = Object.create(null);
    const l = ins._strictListeners;
    if (!l.length) return null;
    l.forEach((_l) => {
      const count = ins._handleCountMap.get(_l);
      for (const [key, value] of ins._reusableEventListenerMap) {
        if (value === _l) {
          strictListenerKeyToHandleCountMap[key] = count;
        }
      }
    });
    return {
      strictListenerKeyToHandleCountMap,
    };
  }

  remover(listener: StateEventListener, key?: string) {
    return () => {
      const index = this._listeners.findIndex((cb) => cb === listener);
      if (index !== -1) {
        this._listeners.splice(index, 1);
        this._handleCountMap.delete(listener);
      }
      if (key) this._reusableEventListenerMap.delete(key);
    };
  }

  addReusableListener(
    listener: StateEventListener,
    key: string,
    triggerOnceIfTrue: boolean
  ) {
    if (this._reusableEventListenerMap.has(key))
      return {
        remover: this.remover(listener, key),
      };

    this._reusableEventListenerMap.set(key, listener);

    const index = this._listeners.findIndex((cb) => cb === listener);
    if (index === -1) {
      this._handleCountMap.set(listener, 0);
      this._listeners.push(listener);
    }

    if (triggerOnceIfTrue && this._value && this.listenerGuard(listener)) {
      this.incrementHandleCount(listener);
      listener(this._value);
    }

    return {
      remover: this.remover(listener, key),
    };
  }

  // listener can't be deleted
  addStrictReusableListener(
    listener: StateEventListener,
    key: string,
    triggerOnceIfTrue: boolean
  ) {
    const count = this._strictListenerKeyToHandleCountMap[key] || 0;
    const index = this._strictListeners.findIndex((cb) => cb === listener);

    const prevListener = this._reusableStrictEventListenerMap.get(key);
    if (prevListener) {
      this._handleCountMap.delete(listener);
      const idx = this._strictListeners.findIndex((l) => l === prevListener);
      if (idx !== -1) this._strictListeners.splice(idx, 1);
    }

    // should set before trigger
    this._handleCountMap.set(listener, count);

    if (index === -1) {
      this._strictListeners.push(listener);
      if (triggerOnceIfTrue && this._value && this.listenerGuard(listener)) {
        this.incrementHandleCount(listener);
        listener(this._value);
      }
    }

    this._reusableStrictEventListenerMap.set(key, listener);

    if (triggerOnceIfTrue && this._value && this.listenerGuard(listener)) {
      this.incrementStrictListenerHandleCount(listener);
      listener(this._value);
    }

    return {
      remover: noop,
    };
  }

  /**
   *
   * @param listener
   * @param triggerOnceIfTrue on initial, if value is true, then trigger..
   * @returns
   */
  addListener(listener: StateEventListener, triggerOnceIfTrue: boolean) {
    const index = this._listeners.findIndex((cb) => cb === listener);
    if (index === -1) {
      this._handleCountMap.set(listener, 0);
      this._listeners.push(listener);
    }

    if (triggerOnceIfTrue && this._value && this.listenerGuard(listener)) {
      this.incrementHandleCount(listener);
      listener(this._value);
    }

    return this.remover(listener);
  }

  getHandleCount(handler: StateEventListener) {
    return this._handleCountMap.get(handler) || 0;
  }

  incrementHandleCount(handler: StateEventListener) {
    const value = this._handleCountMap.get(handler) || 0;
    this._handleCountMap.set(handler, value + 1);
  }

  incrementStrictListenerHandleCount(handler: StateEventListener) {
    const value = this._handleCountMap.get(handler) || 0;
    this._handleCountMap.set(handler, value + 1);
    const key = getMapKeyByValue(this._reusableStrictEventListenerMap, handler);
    if (key) {
      const _value = this._strictListenerKeyToHandleCountMap[key] || 0;
      this._strictListenerKeyToHandleCountMap[key] = _value + 1;
    }
  }

  get value() {
    return this._value;
  }

  setValue(value: boolean) {
    this.trigger(value);
  }

  // 大的开关，是否要跑trigger逻辑
  guard() {
    if (!this._once) return true;
    // has a listener still not triggered.
    for (const value of this._handleCountMap.values()) {
      if (!value) return true;
    }
    return false;
  }

  /**
   *
   * @param cb
   * @returns to control whether a listener should be triggered or not..
   * 用来卡，某一个listener是不是需要被触发
   */
  listenerGuard(cb: StateEventListener) {
    if (!this._once) return true;
    if (this._handleCountMap.get(cb)) return false;
    return true;
  }

  cancelIdleCallbackPolyfill(callbackId: number) {
    if (this._canIUseRIC) {
      // @ts-ignore
      if (typeof cancelIdleCallback === 'function') {
        // @ts-ignore
        cancelIdleCallback(callbackId);
      }
    }

    this._callbackId = null;
  }

  trigger(value: boolean) {
    const shouldPerformScheduler = this.guard();
    if (!shouldPerformScheduler) return;
    if (value && !this._batchUpdateEnabled) {
      this._trigger(value, true);
      return;
    }

    this._triggerBatchinator.dispose({
      abort: true,
    });
    this._triggerBatchinator.schedule(value);
  }

  get listeners() {
    const arr = [];
    this._listeners.forEach((listener) =>
      arr.push({ type: 'normal', listener })
    );
    this._strictListeners.forEach((listener) =>
      arr.push({ type: 'strict', listener })
    );
    return arr;
  }

  _trigger(value: boolean, immediately: boolean) {
    const now = Date.now();

    if (immediately) {
      this._callbackStartMinMs = now;
      if (this._callbackId) {
        this.cancelIdleCallbackPolyfill(this._callbackId);
      }
      if (this._value !== value) {
        this.listeners.forEach(({ listener, type }) => {
          if (this.listenerGuard(listener)) {
            if (type === 'strict')
              this.incrementStrictListenerHandleCount(listener);
            else this.incrementHandleCount(listener);
            listener(value);
          }
        });
      }
      this._value = value;
    } else {
      if (this._callbackId) {
        this.cancelIdleCallbackPolyfill(this._callbackId);
      }
      this._callbackStartMinMs = now;

      const handler = (() => {
        if (now < this._callbackStartMinMs) return;
        if (this._value !== value) {
          this.listeners.forEach(({ listener, type }) => {
            if (this.listenerGuard(listener)) {
              if (type === 'strict')
                this.incrementStrictListenerHandleCount(listener);
              else this.incrementHandleCount(listener);
              listener(value);
            }
          });
        }
        this._value = value;
      }).bind(this);

      this._callbackId = this._canIUseRIC
        ? // @ts-ignore TODO----
          setTimeout(handler)
        : handler();
    }
  }
}

export default ItemMetaStateEventHelper;
