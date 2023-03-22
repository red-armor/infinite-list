import { MasonryListStateResult } from './types/MasonryList.types';

class MasonryList<ITemT extends {} = {}> {
  private _state: MasonryListStateResult<ITemT>;

  getState() {
    return this._state;
  }
}

export default MasonryList;
