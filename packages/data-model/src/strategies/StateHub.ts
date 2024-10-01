import {
  GenericItemT,
  ListState,
  StateListener,
  StateHubProps,
} from '../types';
import RecycleStateImpl from './RecycleStateImpl';

class StateHub<ItemT extends GenericItemT = GenericItemT> {
  private _handler: RecycleStateImpl<ItemT>;

  constructor(props: StateHubProps<ItemT>) {
    const {
      listContainer,

      recyclerTypes,
      // recycleEnabled,
      onRecyclerProcess,
      recyclerBufferSize,
      recyclerReservedBufferPerBatch,
    } = props;

    this._handler = new RecycleStateImpl({
      listContainer,
      recyclerTypes,
      onRecyclerProcess,
      recyclerBufferSize,
      recyclerReservedBufferPerBatch,
    });
  }

  setState(state: ListState) {
    this._handler.setState(state);
  }

  addStateListener(listener: StateListener<ItemT>) {
    this._handler.addStateListener(listener);
  }

  addBuffer(type: string) {
    this._handler.addBuffer(type);
  }
}

export default StateHub;
