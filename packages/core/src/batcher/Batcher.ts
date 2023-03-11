import { scheduleMicrotask } from './utils';

class Batcher {
  private queue: Function[];

  private _waitingForSchedule: boolean;

  constructor() {
    this.queue = [] as Function[];
    this._waitingForSchedule = false;
  }

  flush() {
    this.queue.forEach((queue) => queue.call(this));
    this.queue = [];
  }

  batch(callback: Function) {
    this.queue.push(callback);

    if (!this._waitingForSchedule) {
      scheduleMicrotask(() => {
        this._waitingForSchedule = false;
        this.flush();
      });
      this._waitingForSchedule = true;
    }
  }
}

export default Batcher;
