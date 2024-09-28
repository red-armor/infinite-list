import BaseDimensions from './BaseDimensions';
import Dimension from './Dimension';
import ItemMetaStateEventHelper from './ItemMetaStateEventHelper';
import { DEFAULT_LAYOUT, DEFAULT_RECYCLER_TYPE } from './common';
import {
  ItemLayout,
  ItemMetaOwner,
  ItemMetaState,
  ItemMetaProps,
  StateEventListener,
  ItemMetaStateEventHelperProps,
} from './types';
import noop from '@x-oasis/noop';
import defaultBooleanValue from '@x-oasis/default-boolean-value';
import ViewabilityItemMeta from './viewable/ViewabilityItemMeta';

export const isValidMetaLayout = (meta: ItemMeta | null | undefined) =>
  !!(meta && !meta.isApproximateLayout && meta.getLayout());

// make itemMeta could be shared, such as data source ref change, but it's value
// not changed.
export let context: {
  [key: string]: ItemMeta;
} = {};

let count = 0;

export const resetContext = () => {
  context = {};
};

class ItemMeta extends ViewabilityItemMeta {
  private _isListItem: boolean;
  private _id: string;
  private _layout?: ItemLayout;
  private _separatorLength?: number;
  private _recyclerType: string;
  private _owner: ItemMetaOwner;
  private _state: ItemMetaState;
  private _stateEventSubscriptions: Map<string, ItemMetaStateEventHelper>;
  readonly getMetaOnViewableItemsChanged?: any;
  readonly _canIUseRIC?: boolean;
  private _isApproximateLayout: boolean;
  private _ignoredToPerBatch: boolean;
  private _useSeparatorLength: boolean;
  private _spawnProps: {
    [key: string]: ItemMetaStateEventHelperProps;
  };

  constructor(props: ItemMetaProps) {
    super(props);
    const {
      owner,
      separatorLength,
      layout,
      state,
      isListItem,
      canIUseRIC,
      spawnProps = {},
      ignoredToPerBatch,
      isInitialItem = false,
      isApproximateLayout = true,

      useSeparatorLength = true,

      recyclerType = DEFAULT_RECYCLER_TYPE,
    } = props;
    this._owner = owner;
    this._id = `item_meta_${count++}`;
    this._layout = layout;
    this._separatorLength = separatorLength || 0;
    this._isListItem = isListItem || false;
    this._stateEventSubscriptions = new Map();
    this._ignoredToPerBatch = !!ignoredToPerBatch;
    this._useSeparatorLength = useSeparatorLength;
    this._state =
      state || this._owner?.resolveConfigTuplesDefaultState
        ? this._owner?.resolveConfigTuplesDefaultState(!!isInitialItem)
        : {};

    this._canIUseRIC = canIUseRIC;
    this._isApproximateLayout = isApproximateLayout;
    this._recyclerType = recyclerType;
    this._spawnProps = spawnProps;

    this.addStateEventListener = this.addStateEventListener.bind(this);
    context[this.key] = this;
  }

  static spawn(props: ItemMetaProps) {
    const ancestor = context[props.key];
    if (ancestor) {
      const layout = ancestor.getLayout();
      const spawnProps: {
        [key: string]: any;
      } = {};
      for (const [key, value] of ancestor._stateEventSubscriptions) {
        const _props = ItemMetaStateEventHelper.spawn(value);
        if (_props) spawnProps[key] = _props;
      }

      return new ItemMeta({
        layout,
        // isApproximateLayout may cause change...
        isApproximateLayout: ancestor.isApproximateLayout,
        spawnProps,
        ...props,
      });
    }

    return new ItemMeta(props);
  }

  get id() {
    return this._id;
  }

  get ignoredToPerBatch() {
    return this._ignoredToPerBatch;
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
    return this._separatorLength || 0;
  }

  getContainerOffset() {
    return this._owner.getContainerOffset();
  }

  getItemLength() {
    const selectValue = this._owner.getSelectValue();
    return this._layout ? selectValue.selectLength(this._layout) : 0;
  }

  setUseSeparatorLength(value: boolean) {
    this._useSeparatorLength = value;
  }

  getFinalItemLength() {
    if (this._useSeparatorLength) {
      return this.getItemLength() + this.getSeparatorLength();
    }

    return this.getItemLength();
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

    const selectValue = this._owner.getSelectValue();
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

  override getKey() {
    return this._key;
  }

  ensureStateHelper(
    eventName: string,
    value: boolean
  ): ItemMetaStateEventHelper {
    if (!this._stateEventSubscriptions.get(eventName)) {
      const helper = new ItemMetaStateEventHelper({
        ...(this._spawnProps[eventName] || {}),
        eventName,
        key: this._key,
        defaultValue: value,
        canIUseRIC: this._canIUseRIC,
      });
      this._stateEventSubscriptions.set(eventName, helper);
    }

    return this._stateEventSubscriptions.get(eventName)!;
  }

  getIndexInfo() {
    return this._owner.getIndexInfo(this._key);
  }

  override getIndex() {
    const info = this.getIndexInfo();
    return info?.index || -1;
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

  /**
   *
   * @param event
   * @param callback
   * @param triggerOnceIfTrue
   *
   * In reuse condition, once add listener, then it will not be changed anymore.
   *
   */
  addStStateReusableEventListener(
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

  /**
   *
   * @param event
   * @param callback
   * @param triggerOnceIfTrue
   *
   * In reuse condition, once add listener, then it will not be changed anymore.
   *
   */
  addStrictStateReusableEventListener(
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
    return stateEventHelper?.addStrictReusableListener(
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
    return stateEventHelper?.addListener(
      callback,
      defaultBooleanValue(triggerOnceIfTrue, true)
    );
  }
}

export default ItemMeta;
