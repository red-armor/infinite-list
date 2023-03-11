import BaseDimensions from './BaseDimensions';
import Dimension from './Dimension';
import ItemMetaStateEventHelper from './ItemMetaStateEventHelper';
import { DEFAULT_LAYOUT, noop } from './common';
import {
  ItemLayout,
  ItemMetaOwner,
  ItemMetaState,
  StateEventListener,
} from './types';

class ItemMeta {
  private _isListItem: boolean;
  private _layout?: ItemLayout;
  private _separatorLength?: number;
  private _owner?: ItemMetaOwner;
  private _setState?: Function;
  private _state: ItemMetaState;
  private _stateEventSubscriptions: Map<string, ItemMetaStateEventHelper>;
  readonly getMetaOnViewableItemsChanged?: any;
  readonly _key: string;
  readonly _ownerId: string;

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
  }) {
    const {
      key,
      owner,
      setState,
      separatorLength,
      layout,
      state,
      isListItem,
      isInitialItem = false,
    } = props;
    this._key = key;
    this._owner = owner;
    this._setState = setState;
    this._layout = layout;
    this._separatorLength = separatorLength || 0;
    this._isListItem = isListItem || false;
    this._stateEventSubscriptions = new Map();
    this._state =
      state || this._owner?.resolveConfigTuplesDefaultState
        ? this._owner?.resolveConfigTuplesDefaultState(!!isInitialItem)
        : {};

    this.addStateListener = this.addStateListener.bind(this);
    this.removeStateListener = this.removeStateListener.bind(this);
    this.addStateEventListener = this.addStateEventListener.bind(this);
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
    let hasChangedValue = false;

    Object.keys({ ...state }).forEach((key) => {
      const helper = this._stateEventSubscriptions.get(key);
      const currentValue = state[key];

      if (helper) {
        const falsy = helper.setValue(currentValue);
        if (falsy) hasChangedValue = true;
      }

      if (key === 'viewable') {
        const impressionHelper =
          this._stateEventSubscriptions.get('impression');
        impressionHelper?.trigger(currentValue);
      }
    });
    if (typeof this._setState === 'function' && hasChangedValue)
      this._setState(state);

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
      });
      this._stateEventSubscriptions.set(eventName, helper);
    }

    return this._stateEventSubscriptions.get(eventName);
  }

  getIndexInfo() {
    return this._owner.getIndexInfo(this._key);
  }

  addStateListener(setState: Function) {
    if (typeof setState === 'function') this._setState = setState;
    return this.removeStateListener;
  }

  removeStateListener() {
    this._setState = null;
  }

  addStateEventListener(event: string, callback: StateEventListener) {
    if (typeof callback !== 'function') return noop;
    const stateEventHelper = this.ensureStateHelper(
      event,
      event === 'impression' ? this._state['viewable'] : this._state[event]
    );
    return stateEventHelper.addListener(callback);
  }
}

export default ItemMeta;
