import ListDimensions from '../ListDimensions';
import ListGroupDimensions from '../ListGroupDimensions';

class Manager {
  private _list: Array<ListDimensions | ListGroupDimensions> = [];

  constructor() {}

  addList(instance: ListDimensions | ListGroupDimensions) {
    this._list.push(instance);
    return () => {
      const index = this._list.findIndex((l) => l === instance);
      if (index !== -1) this._list.splice(index, 1);
    };
  }

  getList(instance: ListDimensions | ListGroupDimensions) {
    const index = this._list.findIndex((l) => l === instance);
    if (index !== -1) return this._list[index];
    return null;
  }

  getKeyList(listKey: string) {
    const len = this._list.length;
    for (let index = len - 1; index >= 0; index--) {
      const list = this._list[index];
      if (listKey === list.id) return list;
    }
    return null;
  }
}

export default new Manager();
