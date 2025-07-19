import DisposableStore from './DisposableStore';
import { isFunction, isObject } from './assertion/type';
import type { DisposableFunction, IDisposable } from './types/disposable';

export function isDisposable<T extends object>(
  thing: T
): thing is T & IDisposable {
  return Boolean(isObject(thing) && isFunction((thing as IDisposable).dispose));
}

export function toDisposable(fn: DisposableFunction): IDisposable {
  return {
    dispose: () => fn(),
  };
}

export class Disposable implements IDisposable {
  static readonly None = Object.freeze<IDisposable>({
    dispose() {
      // noop
    },
  });

  private readonly _store = new DisposableStore();
  // private _effectDisposable: IDisposable | undefined;

  public dispose(): void {
    this._store.dispose();
  }

  registerDisposable<T extends IDisposable>(disposable: T) {
    if ((disposable as any) === this) {
      throw new Error('Can not register itself');
    }
    return this._store.add(disposable);
  }
}
