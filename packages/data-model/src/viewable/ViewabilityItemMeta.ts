abstract class ViewabilityItemMeta {
  readonly _key: string;

  constructor(props) {
    const { key } = props;
    this._key = key;
  }

  getKey() {
    return this._key;
  }

  get key() {
    return this._key;
  }

  // getMetaOnViewableItemsChanged() {
  //   return {}
  // }

  abstract getItemOffset(): number;
  abstract getItemLength(): number;
}

export default ViewabilityItemMeta;
