import BatchinateLast from '@x-oasis/batchinate-last';

class StillnessHelper {
  private _thresholdValueMS: number;
  private _handler: Function;
  private _isStill: boolean;

  public startClockBatchinateLast: BatchinateLast;

  constructor(props: {
    handler: (...args: any[]) => void;
    stillnessThreshold: number;
  }) {
    const { handler, stillnessThreshold } = props;
    this._isStill = true;
    this._handler = handler;

    this._thresholdValueMS = stillnessThreshold;
    this.startClockBatchinateLast = new BatchinateLast(
      this.clock.bind(this),
      this._thresholdValueMS
    );
  }

  get enabled() {
    return !!this._thresholdValueMS;
  }

  get isStill() {
    if (this.enabled) return this._isStill;
    return false;
  }

  clock(...args: any[]) {
    if (typeof this._handler === 'function') {
      this._handler.apply(this, args); // eslint-disable-line
    }
  }
}

export default StillnessHelper;
