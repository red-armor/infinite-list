import { Disposable } from './Disposable';
import { Event } from './emitter';
import { shallowEqual } from './utils';

export type IDisposableServiceState = Record<string, any>;

abstract class DisposableService<
  State extends IDisposableServiceState = object
> extends Disposable {
  private _onStateChangedEvent = new Event<State>({ name: 'on-state-changed' });
  onStateChanged = this._onStateChangedEvent.subscribe;

  abstract _state: State;

  constructor() {
    super();
    this.registerDisposable(this._onStateChangedEvent);
  }

  getState() {
    return this._state;
  }

  setState(obj: Partial<State> | ((state: State) => Partial<State>)) {
    const _state = { ...this._state };

    if (typeof obj === 'function') {
      const nextState = obj(this._state);
      this._state = {
        ...this._state,
        ...nextState,
      };
    } else {
      this._state = {
        ...this._state,
        ...obj,
      };
    }

    console.log('set =====', this.getState(), _state);

    if (!shallowEqual(_state, this.getState())) {
      this._onStateChangedEvent.fire(this.getState(), _state);
    }
  }
}

export default DisposableService;
