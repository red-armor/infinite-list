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
}

export default ListProvider