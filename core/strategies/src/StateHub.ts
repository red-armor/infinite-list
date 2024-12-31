import {
  GenericItemT,
  ListState,
  StateListener,
  StateHubProps,
  ListStateResult,
} from './types';
import RecycleStateImpl from './RecycleStateImpl';
import SpaceStateImpl from './SpaceStateImpl';

class StateHub<ItemT extends GenericItemT = GenericItemT> {
  private _handler: RecycleStateImpl<ItemT> | SpaceStateImpl<ItemT>;

  constructor(props: StateHubProps<ItemT>) {
    const {
      listContainer,

      persistenceIndices,
      initialNumToRender,
      recyclerTypes,
      onRecyclerProcess,
      recyclerBufferSize,
      recycleEnabled = true,
      recyclerReservedBufferPerBatch,
    } = props;

    this._handler = recycleEnabled
      ? new RecycleStateImpl<ItemT>({
          persistenceIndices,
          initialNumToRender,
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

  /**
   *
   * @param state
   *
   * return nothing
   */
  setState(state: ListState) {
    this._handler.setState(state);
  }

  /**
   *
   * @param state
   * @returns StateResult
   *
   * comparing with setState, it should return StateResult after state hub handler
   */
  dispatchState(
    state: ListState
  ): [ListStateResult<ItemT>, ListStateResult<ItemT>] {
    return this._handler.dispatchState(state);
  }

  getStateResult() {
    return this._handler.getStateResult();
  }

  addStateListener(listener: StateListener<ItemT>) {
    return this._handler.addStateListener(listener);
  }

  addBuffer(type: string) {
    (this._handler as RecycleStateImpl<ItemT>).addBuffer(type);
  }

  get stateResult() {
    return this._handler.getStateResult();
  }
}

export default StateHub;
