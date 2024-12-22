import SelectValue, {
  selectHorizontalValue,
  selectVerticalValue,
} from '@x-oasis/select-value';
import { DEFAULT_LAYOUT } from './common';

import { ItemLayout, BaseContainerProps, ContainerLayoutGetter } from './types';

class BaseContainer {
  public id: string;
  private _layout: ItemLayout = DEFAULT_LAYOUT;
  private _getContainerLayout?: ContainerLayoutGetter;
  private _horizontal: boolean;
  public _selectValue: SelectValue;
  private _canIUseRIC: boolean;

  constructor(props: BaseContainerProps) {
    const { id, canIUseRIC, horizontal = false, getContainerLayout } = props;

    this.id = id;
    this._canIUseRIC = !!canIUseRIC;
    this._horizontal = !!horizontal;
    this._selectValue = horizontal
      ? selectHorizontalValue
      : selectVerticalValue;
    this._getContainerLayout = getContainerLayout;
  }

  getHorizontal() {
    return this._horizontal;
  }

  get horizontal() {
    return this._horizontal;
  }

  getContainerLayout() {
    if (typeof this._getContainerLayout === 'function')
      return this._getContainerLayout();
    if (this._layout) return this._layout;
    return null;
  }

  getLayout() {
    return this._layout;
  }

  setLayout(layout: ItemLayout) {
    this._layout = layout;
  }

  getContainerOffset() {
    const layout = this.getContainerLayout();
    if (!layout) return 0;
    return this._selectValue.selectOffset(layout);
  }

  /**
   *
   * @param layout container layout
   */
  setContainerLayout(layout: ItemLayout) {
    this._layout = layout;
  }

  getSelectValue() {
    return this._selectValue;
  }

  get canIUseRIC() {
    return this._canIUseRIC;
  }
}

export default BaseContainer;
