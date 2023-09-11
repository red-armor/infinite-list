interface ListProvider {
  /**
   * TODO: temp not setting
   */
  itemToDimensionMap: WeakMap<any, any>;

  getKeyItem();
  getItemKey();
  getItemDimension();
  getKeyDimension();
  getItemMeta(item: any): any;
  getIndexItemMeta(index: number): any;
  getReflowItemsLength(): number;

  getFinalKeyItem();
  getFinalItemKey(item: any): any;
  getFinalItemDimension();
  getFinalKeyDimension();
  getFinalItemMeta(item: any): any;
  getFinalIndexItemMeta(index: number): any;
  getFinalReflowItemsLength(): number;
}

export default ListProvider