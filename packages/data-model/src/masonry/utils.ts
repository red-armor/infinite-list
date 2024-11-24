import { GenericItemT, KeysChangedType } from '../types';
import MasonryDimensionsModel from './MasonryDimensionsModel';

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
  ItemT extends GenericItemT = GenericItemT
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
  let lengthList: number[] = [];
  const dataSource: ItemT[][] = [];
  if (
    [KeysChangedType.Append, KeysChangedType.Initial].indexOf(
      dataChangedType
    ) !== -1
  ) {
    startIndex = oldData.length;
    lengthList = columnDataModels.map((dataModel, index) => {
      const length = dataModel.getTotalLength();
      const oldDataSource = columnDataModels[index].getData().slice();

      dataSource.push(oldDataSource);
      if (typeof length === 'number') return length;
      if (typeof length === 'string') return parseFloat(length);
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

  return dataSource;
};
