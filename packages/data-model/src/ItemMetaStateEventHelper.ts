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

  constructor(props: {
    key: string;
    eventName: string;
    batchUpdateEnabled?: boolean;
    defaultValue: boolean;
    once?: boolean;
  }) {
    const {
      key,
      eventName,
      batchUpdateEnabled = true,
      defaultValue = false,
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

    if (defaultValue) {
      this.trigger(defaultValue);
    }
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

    return () => {
      const index = this._listeners.findIndex((cb) => cb === listener);
      if (index !== -1) {
        this._listeners.splice(index, 1);
        this._handleCountMap.delete(listener);
      }
    };
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

  trigger(value: boolean) {
    const shouldPerformScheduler = this.guard();
    if (!shouldPerformScheduler) return;
    if (value && !this._batchUpdateEnabled) {
      this._trigger(value);
      return;
    }

    this._triggerBatchinator.dispose({
      abort: true,
    });
    this._triggerBatchinator.schedule(value);
  }

  _trigger(value) {
    if (this._value !== value) {
      this._listeners.forEach((cb) => {
        if (this.listenerGuard(cb)) {
          this.incrementHandleCount(cb);
          cb(value);
        }
      });
    }
    this._value = value;
  }
}

export default ItemMetaStateEventHelper;
