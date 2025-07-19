import { toDisposable } from '../Disposable';
import type { EventListener, EventProps, TheFunction } from './types';

export default class Event<T = any> {
  readonly name: string;

  private _listeners: EventListener<T>[] = [];

  private _onWillAddFirstListener?: TheFunction;

  private _onDidAddFirstListener?: TheFunction;

  private _onDidAddListener?: TheFunction;

  private _onWillRemoveListener?: TheFunction;

  private _onDidRemoveLastListener?: TheFunction;

  private _coldTrigger?: boolean;

  private _cacheCurrentValue?: any[];

  constructor(props: EventProps & { name: string }) {
    const {
      name,
      onWillAddFirstListener,
      onDidAddFirstListener,
      onDidAddListener,
      onWillRemoveListener,
      onDidRemoveLastListener,
      coldTrigger,
    } = props;

    this.name = name;

    this._coldTrigger = coldTrigger;
    this._onWillAddFirstListener = onWillAddFirstListener;
    this._onDidAddFirstListener = onDidAddFirstListener;
    this._onDidAddListener = onDidAddListener;
    this._onWillRemoveListener = onWillRemoveListener;
    this._onDidRemoveLastListener = onDidRemoveLastListener;
    this.subscribe = this.subscribe.bind(this);
  }

  subscribe(listener: EventListener<T>) {
    if (!this._listeners.length) {
      this._onWillAddFirstListener?.();
    }

    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      console.error('add a duplicate listener');
    } else {
      this._listeners.push(listener);
      if (this._listeners.length === 1) this._onDidAddFirstListener?.();
      this._onDidAddListener?.();
      if (this._coldTrigger && this._cacheCurrentValue) {
        // @ts-expect-error - listener function signature mismatch with cached values
        listener(...this._cacheCurrentValue);
      }
    }

    return toDisposable(() => {
      this.removeListener(listener);
    });
  }

  removeListener(listener: EventListener<T>) {
    const index = this._listeners.indexOf(listener);
    if (index === -1) return;
    this._onWillRemoveListener?.();

    this._listeners.splice(index, 1);
    if (!this._listeners.length) {
      this._onDidRemoveLastListener?.();
    }
  }

  dispose() {
    this._listeners = [];
    this._onDidRemoveLastListener?.();
  }

  fire(...args: any[]) {
    if (this._coldTrigger) {
      this._cacheCurrentValue = args;
    }
    for (const listener of this._listeners) {
      // @ts-expect-error - listener function signature mismatch with args
      listener(...args);
    }
  }
}
