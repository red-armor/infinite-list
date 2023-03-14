import EnabledSelector from './EnabledSelector'

class ListSpyUtils {
  private _selector: EnabledSelector = new EnabledSelector()

  get selector() {
    return this._selector
  }
}

export default new ListSpyUtils();
