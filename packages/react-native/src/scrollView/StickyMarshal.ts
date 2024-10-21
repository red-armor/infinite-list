import Batchinator from '@x-oasis/batchinator';

import {
  InterpolationConfig,
  StickyItemInfo,
  StickyMarshalProps,
  StickyMode,
} from './types';

export function checkValidInputRange(arr: Array<number>) {
  if (arr.length < 2) {
    console.debug('inputRange must have at least 2 elements');
    return false;
  }
  for (let i = 1; i < arr.length; ++i) {
    if (arr[i] < arr[i - 1]) {
      console.debug('inputRange must be monotonically non-decreasing ' + arr);
      return false;
    }
  }

  return true;
}

class StickyMarshal<ItemT = {}> {
  private stickyItemsQueue: Array<StickyItemInfo<ItemT>> = [];
  private mode?: StickyMode;
  private _calculateRangeValuesBatchinator: Batchinator;

  constructor(props: StickyMarshalProps) {
    const { stickyMode } = props;
    this.mode = stickyMode || StickyMode.fluid;
    this._calculateRangeValuesBatchinator = new Batchinator(
      this._calculateRangeValues.bind(this),
      50
    );
  }

  registerStickyItem(
    itemKey: string,
    info: Omit<StickyItemInfo<ItemT>, 'itemKey' | 'startOffset'>
  ) {
    const index = this.findIndex(itemKey);
    const nextInfo = info || {};
    if (index === -1)
      // @ts-ignore
      this.stickyItemsQueue.push({
        itemKey,
        startOffset: 0,
        startCorrection: 0,
        ...nextInfo,
      });

    return () => {
      const index = this.findIndex(itemKey);
      if (index !== -1) this.stickyItemsQueue.splice(index, 1);
    };
  }

  findIndex(itemKey: string) {
    return this.stickyItemsQueue.findIndex(item => item.itemKey === itemKey);
  }

  calculateRangeValues(ownerId?: string) {
    this._calculateRangeValuesBatchinator.schedule(ownerId);
  }

  _calculateRangeValues(ownerId?: string) {
    const len = this.stickyItemsQueue.length;
    const _interpolationConfig: {
      [key: string]: InterpolationConfig;
    } = {};
    const _animatedValueConfig: {
      [key: string]: InterpolationConfig;
    } = {};

    for (let idx = 0; idx < len; idx++) {
      const current = this.stickyItemsQueue[idx];
      const { itemKey, dimensions } = current;
      // @ts-ignore
      const helper = dimensions.getKeyMeta(itemKey, ownerId);
      const selectValue = dimensions.getSelectValue();
      const itemOffsetLengthRelativeToContainer =
        helper?.getItemOffset(true) || 0;
      const containerOffset = helper?.getContainerOffset();

      _animatedValueConfig[itemKey] = {
        inputRange: [],
        outputRange: [],
      };
      const _currentAnimatedValueConfig = _animatedValueConfig[itemKey];

      if (typeof itemOffsetLengthRelativeToContainer !== 'undefined') {
        const totalOffset =
          containerOffset || 0 + itemOffsetLengthRelativeToContainer;

        if (this.mode === StickyMode.fluid) {
          current.startOffset = totalOffset - current.startCorrection;
          // 表示前面还有一个
          if (idx) {
            const prevItem = this.stickyItemsQueue[idx - 1];
            // should use current item's viewabilityGeneral；such as `SectionList`
            // every List will be general, `stickyHeader` should use its own general
            // to get `layout` info.
            const currentDimensions = prevItem.dimensions;
            const prevItemKey = prevItem.itemKey;
            const prevItemLayout = currentDimensions
              //@ts-ignore
              .getKeyMeta(prevItemKey, ownerId)
              ?.getLayout();

            if (prevItemLayout) {
              const prevItemLength = selectValue.selectLength(prevItemLayout);
              const collisionPoint = totalOffset - prevItemLength!;
              const config = _interpolationConfig[prevItemKey];
              const last = Math.max(
                config.inputRange[config.inputRange.length - 1] || 0,
                collisionPoint
              );
              config.inputRange = ([] as Array<number>).concat(
                config.inputRange,
                last + 1,
                last + 2
              );
              config.outputRange = ([] as Array<number>).concat(
                config.outputRange,
                last - prevItem.startOffset,
                last - prevItem.startOffset
              );
              _currentAnimatedValueConfig.inputRange.push(prevItem.startOffset);
              _currentAnimatedValueConfig.outputRange.push(0);
            }
          } else if (current.startOffset) {
            _currentAnimatedValueConfig.inputRange.push(0);
            _currentAnimatedValueConfig.outputRange.push(0);
          }

          _interpolationConfig[itemKey] = {
            inputRange: [
              current.startOffset - 1,
              current.startOffset,
              current.startOffset + 1,
              current.startOffset + 2,
            ],
            outputRange: [0, 0, 1, 2],
          };
          _currentAnimatedValueConfig.inputRange.push(current.startOffset);
          _currentAnimatedValueConfig.outputRange.push(1);
          _currentAnimatedValueConfig.inputRange.push(current.startOffset + 1);
          _currentAnimatedValueConfig.outputRange.push(1);
        } else {
          let prevItemsLength = 0;

          if (idx) {
            const prevItems = this.stickyItemsQueue.slice(0, idx);
            prevItemsLength = prevItems.reduce((acc, cur) => {
              const { itemKey } = cur;
              // @ts-ignore
              const layout = dimensions
                .getKeyMeta(itemKey, ownerId)
                ?.getLayout();
              const itemLength = layout ? selectValue.selectLength(layout) : 0;
              return acc + (itemLength || 0) + cur.startCorrection;
            }, 0);
          }

          current.startOffset =
            totalOffset - current.startCorrection - prevItemsLength;

          const prevItem = this.stickyItemsQueue[idx - 1];
          if (prevItem) {
            _currentAnimatedValueConfig.inputRange.push(prevItem.startOffset);
            _currentAnimatedValueConfig.outputRange.push(0);
          }

          _interpolationConfig[itemKey] = {
            inputRange: [
              current.startOffset - 1,
              current.startOffset,
              current.startOffset + 1,
            ],
            outputRange: [0, 0, 1],
          };

          _currentAnimatedValueConfig.inputRange.push(current.startOffset);
          _currentAnimatedValueConfig.outputRange.push(1);
          _currentAnimatedValueConfig.inputRange.push(current.startOffset + 1);
          _currentAnimatedValueConfig.outputRange.push(1);
        }
      }
    }

    for (let idx = 0; idx < len; idx++) {
      const current = this.stickyItemsQueue[idx];
      const itemKey = current.itemKey;
      const prevConfig = current.interpolationConfig;
      const nextConfig = _interpolationConfig[itemKey];

      const prevAnimatedValueConfig = current.animatedValueConfig;
      const nextAnimatedValueConfig = _animatedValueConfig[itemKey];

      const config: {
        interpolationConfig?: InterpolationConfig;
        animatedValueConfig?: InterpolationConfig;
      } = {};

      if (checkValidInputRange(nextConfig.inputRange)) {
        if (!this.interpolatedConfigEqual(prevConfig, nextConfig)) {
          current.interpolationConfig = nextConfig;
          config.interpolationConfig = nextConfig;
        }
      }

      if (checkValidInputRange(nextAnimatedValueConfig.inputRange)) {
        if (
          !this.interpolatedConfigEqual(
            prevAnimatedValueConfig,
            nextAnimatedValueConfig
          )
        ) {
          current.animatedValueConfig = nextAnimatedValueConfig;
          config.animatedValueConfig = nextAnimatedValueConfig;
        }
      }

      // 只有config发生变化的，才进行config的更新
      if (Object.keys(config).length) {
        current.setConfig(config);
      }
    }
  }

  interpolatedConfigEqual(a: InterpolationConfig, b: InterpolationConfig) {
    const inputEqual =
      JSON.stringify(a?.inputRange) === JSON.stringify(b?.inputRange);
    const outputEqual =
      JSON.stringify(a?.outputRange) === JSON.stringify(b?.outputRange);
    return inputEqual && outputEqual;
  }

  getItemRange(itemKey: string) {
    const index = this.findIndex(itemKey);
    return this.stickyItemsQueue[index].interpolationConfig;
  }
}

export default StickyMarshal;
