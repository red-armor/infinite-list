import resolveChanged from '@x-oasis/resolve-changed';
import { IndexKeysProps, InspectingAPI, InspectingListener } from './types';

class IndexKeys {
  private _indexKeys: Array<string> = [];
  private _inspectingTime: number = Date.now();
  private _inspectingTimes = 0;
  private _heartBeatingIndexKeys: Array<string> = [];
  private _inspectingListener: InspectingListener;

  constructor(props: IndexKeysProps) {}

  get indexKeys() {
    return this._indexKeys;
  }

  push(key: string) {}

  remove(key: string) {}

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

  startCollection() {}

  terminateCollection() {}

  heartBeatResolveChanged() {
    const nextIndexKeys = this._heartBeatingIndexKeys.slice();

    // 比如说，中间发生了顺序调整；自动检测确保
    if (!resolveChanged(this._heartBeatingIndexKeys, this.indexKeys).isEqual) {
      // if (
      //   !shallowArrayEqual(
      //     this._heartBeatingIndexKeys,
      //     this._heartBeatingIndexKeysSentCommit
      //   )
      // ) {
      //   this.indexKeys = nextIndexKeys;
      //   this.onItemsCountChanged();
      //   this._heartBeatingIndexKeysSentCommit = this.indexKeys;
      // }

      this.indexKeys = nextIndexKeys;
      this.onItemsCountChanged();

      this._inspectingTime += 1;

      /**
       * holdout: Attention.
       * To fix insert a element
       */
      let _data = [];
      for (let index = 0; index < this.indexKeys.length; index++) {
        const listKey = this.indexKeys[index];
        const _dimensions = this.getDimension(listKey);
        _data = _data.concat(_dimensions.getData());
      }

      this._flattenData = _data;
      this.calculateDimensionsIndexRange();
    }
  }

  // register first，then inspecting
  heartBeat(props: { listKey: string; inspectingTime: number }) {
    const { listKey, inspectingTime } = props;

    if (inspectingTime < this._inspectingTime) return;

    this._heartBeatingIndexKeys.push(listKey);

    const indexInRegisteredKeys = this.registeredKeys.findIndex(
      (key) => key === listKey
    );

    if (indexInRegisteredKeys !== -1) {
      this.registeredKeys.splice(indexInRegisteredKeys, 1);
    }

    this.heartBeatResolveChanged();
    // this._heartBeatResolveChangedBatchinator.schedule();
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

export default IndexKeys;
