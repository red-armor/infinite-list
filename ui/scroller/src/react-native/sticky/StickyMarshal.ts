import { Scheduler } from '@infinite-list/scheduler';

import {
  InterpolationConfig,
  StickyItemInfo,
  StickyMarshalProps,
  StickyMode,
} from '../types';
import Marshal from '../Marshal';

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

class StickyMarshal {
  private stickyItemsQueue: StickyItemInfo[] = [];
  private mode?: StickyMode;
  private _calculateRangeValuesScheduler: Scheduler;
  readonly marshal: Marshal;

  constructor(props: StickyMarshalProps) {
    const { stickyMode, marshal } = props;
    this.marshal = marshal;
    this.mode = stickyMode || StickyMode.fluid;
    this._calculateRangeValuesScheduler = new Scheduler(
      this._calculateRangeValues.bind(this),
      50
    );
  }

  registerStickyItem(
    itemKey: string,
    info: Omit<StickyItemInfo, 'itemKey' | 'startOffset'>
  ) {
    const index = this.findIndex(itemKey);
    const nextInfo = info || {};
    if (index === -1)
      this.stickyItemsQueue.push({
        itemKey,
        startOffset: 0,
        // @ts-ignore
        startCorrection: 0,
        ...nextInfo,
      });

    return () => {
      const index = this.findIndex(itemKey);
      if (index !== -1) this.stickyItemsQueue.splice(index, 1);
    };
  }

  findIndex(itemKey: string) {
    return this.stickyItemsQueue.findIndex((item) => item.itemKey === itemKey);
  }

  calculateRangeValues() {
    this._calculateRangeValuesScheduler.schedule();
  }

  _calculateRangeValues() {
    const len = this.stickyItemsQueue.length;
    const _interpolationConfig: {
      [key: string]: InterpolationConfig;
    } = {};
    const _animatedValueConfig: {
      [key: string]: InterpolationConfig;
    } = {};
    const selectValue = this.marshal.getScrollHelper().selectValue;

    for (let idx = 0; idx < len; idx++) {
      const current = this.stickyItemsQueue[idx];
      const { itemKey, rect } = current;
      // const helper = dimensions.getKeyMeta(itemKey, ownerId);
      // const selectValue = .getSelectValue();
      // const itemOffsetLengthRelativeToContainer =
      //   helper?.getItemOffset(true) || 0;
      // const containerOffset = helper?.getContainerOffset();

      const containerOffset = selectValue.selectOffset(rect);
      const itemOffsetLengthRelativeToContainer = rect
        ? selectValue.selectLength(rect)
        : 0;

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
          // Iterate over each sticky item in the queue
          if (idx) {
            const prevItem = this.stickyItemsQueue[idx - 1];
            // should use current item's viewabilityGeneral；such as `SectionList`
            // every List will be general, `stickyHeader` should use its own general
            // to get `layout` info.
            // const currentDimensions = prevItem.dimensions;
            const prevItemKey = prevItem.itemKey;
            // const prevItemLayout = currentDimensions
            //   .getKeyMeta(prevItemKey, ownerId)
            //   ?.getLayout();
            const prevItemLayout = prevItem.rect;

            if (prevItemLayout) {
              const prevItemLength =
                selectValue.selectLength(prevItemLayout) || 0;
              const collisionPoint = totalOffset - prevItemLength;
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
              const { rect } = cur;
              const itemLength = rect ? selectValue.selectLength(rect) : 0;
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
        // @ts-ignore
        if (!this.interpolatedConfigEqual(prevConfig, nextConfig)) {
          current.interpolationConfig = nextConfig;
          config.interpolationConfig = nextConfig;
        }
      }

      if (checkValidInputRange(nextAnimatedValueConfig.inputRange)) {
        if (
          !this.interpolatedConfigEqual(
            // @ts-ignore
            prevAnimatedValueConfig,
            nextAnimatedValueConfig
          )
        ) {
          current.animatedValueConfig = nextAnimatedValueConfig;
          config.animatedValueConfig = nextAnimatedValueConfig;
        }
      }

      // Only update the config if it has changed
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
