import {
  GenericItemT,
  ListState,
  StateListener,
  StateHubProps,
} from '../types';
import RecycleStateImpl from './RecycleStateImpl';
import SpaceStateImpl from './SpaceStateImpl';

class StateHub<ItemT extends GenericItemT = GenericItemT> {
  private _handler: RecycleStateImpl<ItemT> | SpaceStateImpl<ItemT>;

  constructor(props: StateHubProps<ItemT>) {
    const {
      listContainer,

      recyclerTypes,
      onRecyclerProcess,
      recyclerBufferSize,
      recycleEnabled = true,
      recyclerReservedBufferPerBatch,
    } = props;

    this._handler = recycleEnabled
      ? new RecycleStateImpl<ItemT>({
          listContainer,
          recyclerTypes,
          onRecyclerProcess,
          recyclerBufferSize,
          recyclerReservedBufferPerBatch,
        })
      : new SpaceStateImpl<ItemT>({
          listContainer,
        });
  }

  setState(state: ListState) {
    this._handler.setState(state);
  }

  addStateListener(listener: StateListener<ItemT>) {
    this._handler.addStateListener(listener);
  }

  addBuffer(type: string) {
    (this._handler as RecycleStateImpl<ItemT>).addBuffer(type);
  }

  get stateResult() {
    return this._handler.getStateResult();
  }
}

export default StateHub;
