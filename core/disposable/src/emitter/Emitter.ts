import Event from './Event';
import type { EventProps } from './types';

export default class Emitter {
  private _events = new Map<string, Event>();

  private _disposed = false;

  private _name: string;

  constructor(props: { name: string }) {
    const { name } = props || {};
    this._name = name;
  }

  get name() {
    return this._name;
  }

  /**
   * 没有就注册，有就返回
   */
  register(eventName: string, eventProps?: EventProps) {
    if (this._events.has(eventName)) {
      return this._events.get(eventName) as Event;
    }

    this._events.set(
      eventName,
      new Event({
        ...(eventProps || {}),
        name: eventName,
      })
    );

    return this._events.get(eventName) as Event;
  }

  getEvent(eventName: string) {
    return this._events.get(eventName);
  }

  dispose() {
    if (this._disposed) return;
    for (const [_, event] of this._events) {
      event.dispose();
    }

    this._disposed = true;
  }
}

export type IEvent = Event;
