import Batchinator from '@x-oasis/batchinator';
import defaultBooleanValue from '@x-oasis/default-boolean-value';
import noop from '@x-oasis/noop';
import { StateEventListener, ItemMetaStateEventHelperProps } from './types';

let canIUseRIC = false;
let finished = false;

setTimeout(() => {
  if (finished) return;
  canIUseRIC = false;
  finished = true;
});
// @ts-ignore
requestIdleCallback(() => {
  canIUseRIC = true;
  finished = true;
});

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
  private _reusableEventListenerMap = new Map();
  private _callbackId: number;
  private _callbackStartMinMs: number;
  readonly _canIUseRIC: boolean;

  constructor(props: ItemMetaStateEventHelperProps) {
    const {
      key,
      eventName,
      batchUpdateEnabled,
      defaultValue = false,
      canIUseRIC: _canIUseRIC,
      once,
      strictListeners = [],
      handleCountMap = new Map(),
    } = props;

    this._key = key;
    this._eventName = eventName;
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

    this._triggerBatchinator = new Batchinator(this._trigger.bind(this), 50);
    this.remover = this.remover.bind(this);
    this._handleCountMap = handleCountMap;
    this._strictListeners = strictListeners;
    // ric in RN can not be triggered. https://github.com/facebook/react-native/issues/28602
    this._canIUseRIC = defaultBooleanValue(_canIUseRIC, canIUseRIC);

    if (defaultValue) {
      this.trigger(defaultValue);
    }
  }

  static spawn(ins: ItemMetaStateEventHelper) {
    const l = ins._strictListeners;
    if (!l.length) return null;
    const m = new Map();
    l.forEach((_l) => {
      m.set(_l, ins._handleCountMap.get(_l));
    });
    return {
      strictListeners: l,
      handleCountMap: m,
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
    this.addListener(listener, triggerOnceIfTrue);
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
    const old = this._reusableEventListenerMap.get(key);
    if (old) {
      const count = this._handleCountMap.get(old);
      this._reusableEventListenerMap.set(key, listener);
      this.addStrictListener(listener, triggerOnceIfTrue);
      this._handleCountMap.set(listener, count);
      this._handleCountMap.delete(old);
      return { remover: noop };
    }

    this._reusableEventListenerMap.set(key, listener);
    this.addStrictListener(listener, triggerOnceIfTrue);
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

  /**
   *
   * @param listener
   * @param triggerOnceIfTrue on initial, if value is true, then trigger..
   * @returns
   */
  addStrictListener(listener: StateEventListener, triggerOnceIfTrue: boolean) {
    const index = this._strictListeners.findIndex((cb) => cb === listener);
    if (index === -1) {
      this._handleCountMap.set(listener, 0);
      this._strictListeners.push(listener);
    }

    if (triggerOnceIfTrue && this._value && this.listenerGuard(listener)) {
      this.incrementHandleCount(listener);
      listener(this._value);
    }

    return noop;
  }

  getHandleCount(handler: StateEventListener) {
    return this._handleCountMap.get(handler) || 0;
  }

  incrementHandleCount(handler: StateEventListener) {
    const value = this._handleCountMap.get(handler) || 0;
    this._handleCountMap.set(handler, value + 1);
  }

  get value() {
    return this._value;
  }

  setValue(value: boolean) {
    this.trigger(value);
  }

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
    return this._listeners.concat(this._strictListeners);
  }

  _trigger(value: boolean, immediately: boolean) {
    const now = Date.now();

    if (immediately) {
      this._callbackStartMinMs = now;
      if (this._callbackId) {
        this.cancelIdleCallbackPolyfill(this._callbackId);
      }
      if (this._value !== value) {
        this.listeners.forEach((cb) => {
          if (this.listenerGuard(cb)) {
            this.incrementHandleCount(cb);
            cb(value);
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
          this.listeners.forEach((cb) => {
            if (this.listenerGuard(cb)) {
              this.incrementHandleCount(cb);
              cb(value);
            }
          });
        }
        this._value = value;
      }).bind(this);

      this._callbackId = this._canIUseRIC
        ? // @ts-ignore
          requestIdleCallback(handler)
        : handler();
    }
  }
}

export default ItemMetaStateEventHelper;
