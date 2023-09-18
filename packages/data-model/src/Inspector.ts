import resolveChanged from '@x-oasis/resolve-changed';
import Batchinator from '@x-oasis/batchinator';
import {
  InspectorProps,
  InspectingAPI,
  InspectingListener,
  OnIndexKeysChanged,
} from './types';
import ListGroupDimensions from './ListGroupDimensions';

class Inspector {
  private _indexKeys: Array<string> = [];
  private _owner: ListGroupDimensions;
  private _inspectingTime: number = Date.now();
  private _inspectingTimes = 0;
  private _heartBeatingIndexKeys: Array<string> = [];
  private _inspectingListener: InspectingListener;
  private _startInspectBatchinator: Batchinator;
  private _isCollecting = false;
  private _onChange: OnIndexKeysChanged;

  constructor(props?: InspectorProps) {
    const { onChange, owner } = props;
    // 主要用来巡检
    this._startInspectBatchinator = new Batchinator(
      this.startInspection.bind(this),
      50
    );
    this._onChange = onChange;
    this._owner = owner;
    this.heartBeat = this.heartBeat.bind(this);
    this.startInspection = this.startInspection.bind(this);
    this.getAPI = this.getAPI.bind(this);
  }

  get owner() {
    return this._owner;
  }

  get indexKeys() {
    return this._indexKeys;
  }

  push(key: string) {
    this._indexKeys.push(key);
    this._startInspectBatchinator.schedule();
  }

  handleChange() {
    if (typeof this._onChange === 'function')
      this._onChange({
        indexKeys: this._indexKeys,
      });
  }

  remove(key: string) {
    this._startInspectBatchinator.dispose({ abort: true });
    const index = this._indexKeys.findIndex((v) => v === key);
    if (index !== -1) {
      this._indexKeys.splice(index, 1);
      this.handleChange();
    }
  }

  addStartInspectingHandler(cb: InspectingListener) {
    if (typeof cb === 'function') this._inspectingListener = cb;
  }

  startInspection() {
    const time = +Date.now();

    if (typeof this._inspectingListener === 'function') {
      this._inspectingTimes += 1;
      this._heartBeatingIndexKeys = [];
      this._inspectingListener.call(this, {
        inspectingTimes: this._inspectingTimes,
        inspectingTime: time,
        heartBeat: this.heartBeat,
        startInspection: this.startInspection,
      });
    }
  }

  startCollection() {
    if (this._isCollecting) return;
    // cancel on pending task first...
    this._startInspectBatchinator.dispose({
      abort: true,
    });
    this._heartBeatingIndexKeys = [];
    this._isCollecting = true;
  }

  terminateCollection() {
    this._isCollecting = false;
    this.heartBeatResolveChanged();
  }

  heartBeatResolveChanged() {
    const nextIndexKeys = this._heartBeatingIndexKeys.slice();

    // 比如说，中间发生了顺序调整；自动检测确保
    if (!resolveChanged(this._heartBeatingIndexKeys, this._indexKeys).isEqual) {
      this._indexKeys = nextIndexKeys;
      this.handleChange();
      this._inspectingTime += 1;
    }
  }

  // register first，then inspecting
  heartBeat(props: { listKey: string; inspectingTime: number }) {
    const { listKey, inspectingTime } = props;
    if (inspectingTime < this._inspectingTime) return;
    this._heartBeatingIndexKeys.push(listKey);
  }

  getAPI(): InspectingAPI {
    return {
      inspectingTimes: this._inspectingTimes,
      inspectingTime: this._inspectingTime,
      heartBeat: this.heartBeat,
      startInspection: this.startInspection,
    };
  }
}

export default Inspector;
