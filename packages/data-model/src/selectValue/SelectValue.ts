/**
 * initialized with horizontal props, then get correct offset/size value
 */
import {
  // LayoutWithAnimatedOffset,
  LayoutWithOffset,
  LayoutWithSize,
  SelectValueProps,
  _Dimensions,
} from './types';

class SelectValue {
  readonly horizontal: boolean;

  constructor(props: SelectValueProps) {
    const { horizontal } = props;
    this.horizontal = horizontal;
    this.selectLength = this.selectLength.bind(this);
    this.selectOffset = this.selectOffset.bind(this);
    // this.selectAnimatedOffset = this.selectAnimatedOffset.bind(this);
    this.selectTranslate = this.selectTranslate.bind(this);
    this.revertLength = this.revertLength.bind(this);
  }

  selectOffset(layout: LayoutWithOffset) {
    return this.horizontal ? layout.x : layout.y;
  }

  setLength(layout: _Dimensions, length: number) {
    if (this.horizontal) layout.width = length;
    else layout.height = length;
  }

  selectLength(layout: LayoutWithSize) {
    return this.horizontal ? layout.width : layout.height;
  }

  // selectAnimatedOffset(layout: LayoutWithAnimatedOffset) {
  //   return this.horizontal ? layout.x : layout.y;
  // }

  selectTranslate() {
    return this.horizontal ? 'translateX' : 'translateY';
  }

  revertLength(length: number) {
    return this.horizontal
      ? {
          width: length,
          height: null,
        }
      : {
          height: length,
          width: null,
        };
  }
}

export const selectHorizontalValue = new SelectValue({ horizontal: true });
export const selectVerticalValue = new SelectValue({ horizontal: false });

export default SelectValue;
