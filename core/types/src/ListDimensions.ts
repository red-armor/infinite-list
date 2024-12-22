import { GenericItemT } from './generic.types';
import { IListDimensionsModel } from './ListDimensionsModel';
import { IOnEndReachedHelper } from './OnEndReachedHelper';

export interface IListDimensions<ItemT extends GenericItemT = GenericItemT> {
  onItemLayoutChanged: () => void;
  onDataSourceChanged(): void;
  onEndReachedHelper: IOnEndReachedHelper;
  getFinalKeyIndexInfo: (
    itemKey: string,
    listKey: string
  ) => ListIndexInfo<ItemT>;

  /**
   * for state start
   */
  getDataLength(): number;
  initialNumToRender: number;
  getTotalLength(): number;
  getBufferSize(): number;
  computeIndexRange(
    minOffset: number,
    maxOffset: number
  ): {
    startIndex: number;
    endIndex: number;
  };
  // inherit from BaseLayout
  resolveOffsetRange(
    minOffset: number,
    maxOffset: number,
    exclusive?: boolean
  ): {
    minOffset: number;
    maxOffset: number;
  };

  getContainerOffset(): number;
  hasUnLayoutItems(): boolean;
  getOnEndReachedHelper(): IOnEndReachedHelper;

  /**
   * for state end
   */
}

export type ListIndexInfo<ItemT extends GenericItemT = GenericItemT> = {
  dimensions: IListDimensionsModel<ItemT>;
  index?: number;
};
