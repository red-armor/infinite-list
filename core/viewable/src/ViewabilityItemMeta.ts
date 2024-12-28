abstract class ViewabilityItemMeta {
  readonly _key: string;

  constructor(props: { key: string }) {
    const { key } = props;
    this._key = key;
  }

  getKey() {
    return this._key;
  }

  get key() {
    return this._key;
  }

  abstract getIndex(): number;

  // getMetaOnViewableItemsChanged() {
  //   return {}
  // }

  abstract getItemOffset(): number;
  abstract getItemLength(): number;
}

export default ViewabilityItemMeta;
