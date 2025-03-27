import { KeysChangedType } from '@infinite-list/base-dimensions';
// import KeyIndexManager from '../utils/KeyIndexManager';
import { KeyIndexManager } from '@infinite-list/utils';
import PrefixIntervalTree from '@x-oasis/prefix-interval-tree';
import type MasonryDimensionsModel from './MasonryDimensionsModel';
import type { GenericItemT } from './types';

/**
 *
 * @param props
 * @returns
 *
 * when to cause chunkifyDataSource:
 * 1: init data
 * 2: update data
 * 3: update item layout
 *
 * pay attention, on this step, the child strategy related `intervalTree` and
 * `keyIndexManagers` should be shuffled...
 */
export const chunkifyDataSource = <
  ItemT extends GenericItemT = GenericItemT,
>(props: {
  data: ItemT[];
  oldData: ItemT[];
  masonryDataModel: MasonryDimensionsModel<ItemT>;
  dataChangedType: KeysChangedType;
}) => {
  const { data, oldData, masonryDataModel, dataChangedType } = props;

  const columnDataModels = masonryDataModel.getStrategies();

  if (dataChangedType === KeysChangedType.Equal) {
    return columnDataModels.map((dataModel) => dataModel.getData());
  }

  let startIndex = 0;
  // as temp values
  let lengthList: number[] = [];
  // as temp values
  const dataSource: ItemT[][] = [];

  const shouldShuffle = ![
    KeysChangedType.Append,
    KeysChangedType.Initial,
  ].includes(dataChangedType);

  if (!shouldShuffle) {
    startIndex = oldData.length;
    lengthList = columnDataModels.map((dataModel) => {
      dataSource.push([]);
      const length = dataModel.getTotalLength();

      if (typeof length === 'number') return length;
      if (typeof length === 'string') return Number.parseFloat(length);
      return 0;
    });
  } else {
    for (let index = 0; index < columnDataModels.length; index++) {
      dataSource.push([]);
      lengthList.push(0);
    }
  }

  const findMinLengthColumnIndex = () => {
    let minValue = lengthList[0] || 0;
    let minIndex = 0;
    for (let index = 1; index < lengthList.length; index++) {
      const nextValue = lengthList[index];
      if (nextValue < minValue) {
        minValue = nextValue;
        minIndex = index;
      }
    }
    return minIndex;
  };
  let minIndex = findMinLengthColumnIndex();

  for (let idx = startIndex; idx < data.length; idx++) {
    const item = data[idx];
    const currentListLength = lengthList[minIndex];
    dataSource[minIndex].push(item);
    const itemMeta = masonryDataModel.getItemMeta(item, idx);
    // separatorLength should be included
    const itemLength = itemMeta?.getFinalItemLength() || 0;

    lengthList[minIndex] = currentListLength + itemLength;

    const nextInfo = findMinLengthColumnIndex();
    minIndex = nextInfo;
  }

  dataSource.forEach((data, columnIndex) => {
    const len = data.length;

    if (!shouldShuffle) {
      const keyIndexManager =
        masonryDataModel.getColumnKeyIndexManager(columnIndex);
      const intervalTree = masonryDataModel.getColumnIntervalTree(columnIndex);
      data.forEach((item, index) => {
        // TODO: index is not the correct value
        const itemMeta = masonryDataModel.getItemMeta(item, index);
        const key = itemMeta?.getKey();
        if (key) {
          keyIndexManager.setKeyIndex(key, index);
          keyIndexManager.setIndexKey(index, key);
        }
        if (itemMeta?.getLayout()) {
          // const itemLength = this._selectValue.selectLength(meta.getLayout());
          // 最后一个不包含separatorLength
          if (index === len - 1) {
            itemMeta.setUseSeparatorLength(false);
          } else {
            itemMeta.setUseSeparatorLength(true);
          }

          const length = itemMeta.getFinalItemLength();

          intervalTree.drySet(index, length);
        }
      });

      intervalTree.applyUpdate();

      const oldData = columnDataModels[columnIndex].getData();
      dataSource[columnIndex] = ([] as ItemT[]).concat(oldData, data);
    } else {
      // `keyIndexManager` and `intervalTree` are lately created...
      const keyIndexManager = new KeyIndexManager();
      const intervalTree = new PrefixIntervalTree(100);

      data.forEach((item, index) => {
        // TODO: index is not the correct value
        const itemMeta = masonryDataModel.getItemMeta(item, index);
        const key = itemMeta?.getKey();
        if (key) {
          keyIndexManager.setKeyIndex(key, index);
          keyIndexManager.setIndexKey(index, key);
        }
        if (itemMeta?.getLayout()) {
          // const itemLength = this._selectValue.selectLength(meta.getLayout());
          // 最后一个不包含separatorLength
          if (index === len - 1) {
            itemMeta.setUseSeparatorLength(false);
          } else {
            itemMeta.setUseSeparatorLength(true);
          }

          const length = itemMeta.getFinalItemLength();
          intervalTree.drySet(index, length);
        }
      });
      intervalTree.applyUpdate();
      masonryDataModel.setColumnIntervalTree(columnIndex, intervalTree);
      masonryDataModel.setColumnKeyIndexManager(columnIndex, keyIndexManager);
    }
  });
  return dataSource;
};
