import {
  GenericItemT,
  ListState,
  BaseStateImplProps,
  ListStateResult,
} from '../types';
import BaseImpl from './BaseImpl';

abstract class BaseState<ItemT extends GenericItemT = GenericItemT> {
  public listContainer: BaseImpl<ItemT>;

  constructor(props: BaseStateImplProps<ItemT>) {
    this.listContainer = props.listContainer;
  }

  /**
   *
   * @param state
   * @param force
   *
   * Pay attention if you want to compare state first, then decide setState or not..
   * There is a condition the old and new stat are same, but item meta info changed
   * such as approximateLayout props change, then the list should rerun
   *
   */
  abstract setState(state: ListState, force?: boolean): void;

  /**
   *
   * @param stateResult
   *
   * callback function to passing to resolved state to UI Component
   */
  abstract applyStateResult(stateResult: ListStateResult<ItemT>): void;

  abstract getStateResult(): ListStateResult<ItemT>;
}

export default BaseState;
