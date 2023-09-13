import BaseDimensions from './BaseDimensions';
import Dimension from './Dimension';
import ItemMetaStateEventHelper from './ItemMetaStateEventHelper';
import { DEFAULT_LAYOUT, DEFAULT_RECYCLER_TYPE } from './common';
import {
  ItemLayout,
  ItemMetaOwner,
  ItemMetaState,
  StateEventListener,
} from './types';
import noop from '@x-oasis/noop';
import defaultBooleanValue from '@x-oasis/default-boolean-value';
import ViewabilityItemMeta from './viewable/ViewabilityItemMeta';

let count = 0;
class ItemMeta extends ViewabilityItemMeta {
  private _isListItem: boolean;
  private _id: string;
  private _layout?: ItemLayout;
  private _separatorLength?: number;
  private _recyclerType: string;
  private _owner?: ItemMetaOwner;
  private _state: ItemMetaState;
  private _stateEventSubscriptions: Map<string, ItemMetaStateEventHelper>;
  readonly getMetaOnViewableItemsChanged?: any;
  readonly _ownerId: string;
  readonly _canIUseRIC?: boolean;
  private _isApproximateLayout: boolean;

  constructor(props: {
    onViewable?: StateEventListener;
    onImpression?: StateEventListener;
    key: string;
    separatorLength?: number;
    layout?: ItemLayout;
    owner?: ItemMetaOwner;
    isListItem?: boolean;
    setState?: Function;
    state?: ItemMetaState;
    isInitialItem?: boolean;
    canIUseRIC?: boolean;
    recyclerType?: string;
  }) {
    super(props);
    const {
      owner,
      separatorLength,
      layout,
      state,
      isListItem,
      canIUseRIC,
      recyclerType = DEFAULT_RECYCLER_TYPE,
      isInitialItem = false,
    } = props;
    this._owner = owner;
    this._id = `item_meta_${count++}`;
    this._layout = layout;
    this._separatorLength = separatorLength || 0;
    this._isListItem = isListItem || false;
    this._stateEventSubscriptions = new Map();
    this._state =
      state || this._owner?.resolveConfigTuplesDefaultState
        ? this._owner?.resolveConfigTuplesDefaultState(!!isInitialItem)
        : {};

    this._canIUseRIC = canIUseRIC;
    this._isApproximateLayout = false;
    this._recyclerType = recyclerType;

    this.addStateEventListener = this.addStateEventListener.bind(this);
  }

  get id() {
    return this._id;
  }

  get recyclerType() {
    return this._recyclerType;
  }

  get isApproximateLayout() {
    return this._isApproximateLayout;
  }

  set isApproximateLayout(value: boolean) {
    this._isApproximateLayout = value;
  }

  setLayout(layout: ItemLayout) {
    this._layout = layout;
  }

  getLayout() {
    return this._layout;
  }

  getOwner() {
    return this._owner;
  }

  getState() {
    return this._state;
  }

  ensureLayout() {
    if (this._layout) return this._layout;
    this._layout = { ...DEFAULT_LAYOUT };
    return this._layout;
  }

  setSeparatorLength(length: number) {
    this._separatorLength = length;
  }

  getSeparatorLength() {
    return this._separatorLength;
  }

  getContainerOffset() {
    if (this._isListItem)
      return (this._owner as BaseDimensions).getContainerOffset();
    return 0;
  }

  getItemLength() {
    const selectValue = (this._owner as BaseDimensions).getSelectValue();
    return this._layout ? selectValue.selectLength(this._layout) : 0;
  }

  getItemOffset(exclusive?: boolean) {
    if (this._isListItem) {
      const offset = (this._owner as BaseDimensions).getKeyItemOffset(
        this._key,
        exclusive
      );

      return offset;
    }

    // for dimension
    if (this._owner instanceof Dimension) {
      return this._owner.getItemOffset();
    }

    const selectValue = (this._owner as BaseDimensions).getSelectValue();
    return this._layout ? selectValue.selectOffset(this._layout) : 0;
  }

  setItemMetaState(
    state: {
      [key: string]: boolean;
    } = {}
  ) {
    Object.keys({ ...state }).forEach((key) => {
      const helper = this._stateEventSubscriptions.get(key);
      const currentValue = state[key];

      if (helper) {
        helper.setValue(currentValue);
      }

      if (key === 'viewable') {
        const impressionHelper =
          this._stateEventSubscriptions.get('impression');
        impressionHelper?.trigger(currentValue);
      }
    });

    this._state = { ...state };
  }

  getKey() {
    return this._key;
  }

  ensureStateHelper(eventName: string, value: boolean) {
    if (!this._stateEventSubscriptions.get(eventName)) {
      const helper = new ItemMetaStateEventHelper({
        eventName,
        key: this._key,
        defaultValue: value,
        canIUseRIC: this._canIUseRIC,
      });
      this._stateEventSubscriptions.set(eventName, helper);
    }

    return this._stateEventSubscriptions.get(eventName);
  }

  getIndexInfo() {
    return this._owner.getIndexInfo(this._key);
  }

  /**
   *
   * @param event
   * @param callback
   * @param triggerOnceIfTrue
   *
   * In reuse condition, once add listener, then it will not be changed anymore.
   *
   */
  addStateReusableEventListener(
    event: string,
    key: string,
    callback: StateEventListener,
    triggerOnceIfTrue?: boolean
  ): {
    remover: Function;
  } {
    if (typeof callback !== 'function')
      return {
        remover: noop,
      };
    const stateEventHelper = this.ensureStateHelper(
      event,
      // get initial value
      event === 'impression' ? this._state['viewable'] : this._state[event]
    );
    return stateEventHelper.addReusableListener(
      callback,
      key,
      defaultBooleanValue(triggerOnceIfTrue, true)
    );
  }

  addStateEventListener(
    event: string,
    callback: StateEventListener,
    triggerOnceIfTrue?: boolean
  ) {
    if (typeof callback !== 'function') return noop;
    const stateEventHelper = this.ensureStateHelper(
      event,
      // get initial value
      event === 'impression' ? this._state['viewable'] : this._state[event]
    );
    return stateEventHelper.addListener(
      callback,
      defaultBooleanValue(triggerOnceIfTrue, true)
    );
  }
}

export default ItemMeta;
