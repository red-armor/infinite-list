import { DataModelDimensions } from './viewability';

export enum StickyMode {
  fluid = 'fluid',
  stuck = 'stuck',
}

export type StickyMarshalProps = {
  stickyMode?: StickyMode;
};

export type InterpolationConfig = {
  inputRange: Array<number>;
  outputRange: Array<number>;
};

export type StickyItemInfo<ItemT> = {
  itemKey: string;
  /**
   * 吸顶开始时，item顶部离ScrollHelper最顶部的高度，正常就是`containerOffset + itemOffsetToContainer`
   * 但是假如它是`StickyMode.stuck`的话，
   */
  startOffset: number;
  dimensions: DataModelDimensions;
  interpolationConfig?: InterpolationConfig;
  animatedValueConfig?: InterpolationConfig;
  startCorrection: number;

  setConfig: (opt: {
    interpolationConfig?: InterpolationConfig;
    animatedValueConfig?: InterpolationConfig;
  }) => void;
};
