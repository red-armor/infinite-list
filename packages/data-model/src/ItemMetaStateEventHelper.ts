import Batchinator from '@x-oasis/batchinator';
import { StateEventListener } from './types';

class ItemMetaStateEventHelper {
  private _batchUpdateEnabled: boolean;
  private _value = false;
  readonly _eventName: string;
  private _listeners: Array<StateEventListener> = [];
  private _triggerBatchinator: Batchinator;
  private _handleCount = 0;
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

  addListener(listener: StateEventListener) {
    const index = this._listeners.findIndex((cb) => cb === listener);
    if (index === -1) this._listeners.push(listener);
    return () => {
      const index = this._listeners.findIndex((cb) => cb === listener);
      this._listeners.splice(index, 1);
    };
  }

  get value() {
    return this._value;
  }

  setValue(value: boolean) {
    this.trigger(value);
    // return value !== this._value;
  }

  trigger(value: boolean) {
    if (this._once && this._handleCount) return;
    if (value && this._batchUpdateEnabled) {
      this._triggerBatchinator.dispose({
        abort: true,
      });
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
      this._handleCount++;
      this._listeners.forEach((cb) => cb(value));
    }
    this._value = value;
  }
}

export default ItemMetaStateEventHelper;
