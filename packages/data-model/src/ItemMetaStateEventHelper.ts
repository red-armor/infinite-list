import Batchinator from '@x-oasis/batchinator';
import { StateEventListener } from './types';

class ItemMetaStateEventHelper {
  private _batchUpdateEnabled: boolean;
  private _value = false;
  readonly _eventName: string;
  private _listeners: Array<StateEventListener> = [];
  private _triggerBatchinator: Batchinator;
  private _handleCountMap = new Map();
  private _once: boolean;
  readonly _key: string;
  private _reusableEventListenerMap = new Map();
  private _callbackId: number;
  private _callbackStartMinMs: number;
  readonly _canIUseRIC: boolean;

  constructor(props: {
    key: string;
    eventName: string;
    batchUpdateEnabled?: boolean;
    defaultValue: boolean;
    once?: boolean;
    canIUseRIC?: boolean;
  }) {
    const {
      key,
      eventName,
      batchUpdateEnabled,
      defaultValue = false,
      canIUseRIC = true,
      once,
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

    if (defaultValue) {
      this.trigger(defaultValue);
    }

    // ric in RN can not be triggered. https://github.com/facebook/react-native/issues/28602
    this._canIUseRIC = canIUseRIC;
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

  addListener(listener: StateEventListener, triggerOnceIfTrue: boolean) {
    const index = this._listeners.findIndex((cb) => cb === listener);
    if (index === -1) {
      this._handleCountMap.set(listener, 0);
      this._listeners.push(listener);
    }

    if (triggerOnceIfTrue && this._value) {
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

  get value() {
    return this._value;
  }

  setValue(value: boolean) {
    this.trigger(value);
  }

  guard() {
    if (!this._once) return true;
    for (const value of this._handleCountMap.values()) {
      if (!value) return true;
    }
    return false;
  }

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

  _trigger(value: boolean, immediately: boolean) {
    const now = Date.now();

    if (immediately) {
      this._callbackStartMinMs = now;
      if (this._callbackId) {
        this.cancelIdleCallbackPolyfill(this._callbackId);
      }
      if (this._value !== value) {
        this._listeners.forEach((cb) => {
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
          this._listeners.forEach((cb) => {
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
