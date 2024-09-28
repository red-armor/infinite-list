import shallowArrayEqual from '@x-oasis/shallow-array-equal';
import Batchinator from '@x-oasis/batchinator';
import {
  InspectorProps,
  InspectingAPI,
  InspectingListener,
  OnIndexKeysChanged,
} from './types';
import findLastIndex from '@x-oasis/find-last-index';
import ListGroupDimensions from './ListGroupDimensions';

class Inspector {
  private _indexKeys: Array<string> = [];
  // private _anchorRange: AnchorRange = {};
  private _owner: ListGroupDimensions;
  private _inspectingTime: number = Date.now();
  private _inspectingTimes = 0;
  private _heartBeatingIndexKeys: Array<string> = [];
  private _inspectingListener: InspectingListener;
  private _startInspectBatchinator: Batchinator;
  private _handleChangeBatchinator: Batchinator;
  private _updateAnchorKeysBatchinator: Batchinator;
  private _isCollecting = false;
  private _onChange?: OnIndexKeysChanged;
  private _anchorKeys: Array<string> = [];

  constructor(props: InspectorProps) {
    const { onChange, owner } = props || {};
    // 主要用来巡检
    this._startInspectBatchinator = new Batchinator(
      this.startInspection.bind(this),
      50
    );
    this._handleChangeBatchinator = new Batchinator(
      this.handleChange.bind(this),
      50
    );
    this._updateAnchorKeysBatchinator = new Batchinator(
      this.updateAnchorKeys.bind(this),
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
    const anchorKey = this.owner.getFinalAnchorKey(key);
    const index = findLastIndex(this._anchorKeys, (v) => v === anchorKey);

    if (index !== -1) {
      this._indexKeys.splice(index + 1, 0, key);
      this._handleChangeBatchinator.schedule();
    } else {
      this._indexKeys.push(key);
    }
    this._updateAnchorKeysBatchinator.schedule();

    this._startInspectBatchinator.schedule();
    return () => {
      this.remove(key);
    };
  }

  handleChange() {
    if (typeof this._onChange === 'function')
      this._onChange({
        indexKeys: this._indexKeys,
      });
  }

  remove(key: string) {
    const index = this._indexKeys.findIndex((v) => v === key);
    if (index !== -1) {
      this._indexKeys.splice(index, 1);
      this.updateAnchorKeys();
      this._handleChangeBatchinator.schedule();
    }
  }

  findIndex(key: string) {
    return this._indexKeys.findIndex((indexKey) => indexKey === key);
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

  updateAnchorKeys() {
    this._anchorKeys = this._indexKeys.map((key) =>
      this.owner.getFinalAnchorKey(key)
    );

    // this._anchorRange = this._indexKeys.reduce<AnchorRange>(
    //   (acc, cur, index) => {
    //     const anchorKey = this.owner.getFinalAnchorKey(cur);
    //     if (!anchorKey) return acc;
    //     if (acc[anchorKey]) {
    //       const endIndex = acc[anchorKey].endIndex;
    //       acc[anchorKey] = {
    //         ...acc[anchorKey],
    //         endIndex: endIndex + 1,
    //       };
    //     } else {
    //       acc[anchorKey] = {
    //         startIndex: index,
    //         endIndex: index + 1,
    //       };
    //     }
    //     return acc;
    //   },
    //   {}
    // );
  }

  heartBeatResolveChanged() {
    const nextIndexKeys = this._heartBeatingIndexKeys.slice();

    // 比如说，中间发生了顺序调整；自动检测确保
    if (!shallowArrayEqual(this._heartBeatingIndexKeys, this._indexKeys)) {
      this._indexKeys = nextIndexKeys;
      this.handleChange();
      this._updateAnchorKeysBatchinator.schedule();
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
