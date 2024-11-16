import ListDimensionsModel from '../ListDimensionsModel';
import { GenericItemT } from '../types';

export const chunkifyDataSource = <
  ItemT extends GenericItemT = GenericItemT
>(props: {
  columnDataModels: ListDimensionsModel[];
  data: ItemT[];
}) => {
  const { columnDataModels } = props;
  const lengthList = columnDataModels.map((dataModel) =>
    dataModel.getTotalLength()
  );

  const findMinLengthColumnIndex = () => {
    let minValue = lengthList[0];
    let minIndex = 0;
    for (let index = 1; index < lengthList.length; index++) {
      const nextValue = lengthList[index];
      if (nextValue < minValue) {
        minValue = nextValue;
        minIndex = index;
      }
    }
    return [minValue, minIndex];
  };
  findMinLengthColumnIndex();
};
