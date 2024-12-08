class Manager {
  private _setHeaderInfo: Function;
  private _setFooterInfo: Function;

  constructor() {
    // @ts-ignore
    this._setHeaderInfo = null;
    // @ts-ignore
    this._setFooterInfo = null;
  }

  registerHeaderInfoSetter(setInfo: Function) {
    this._setHeaderInfo = setInfo;
  }

  registerFooterInfoSetter(setInfo: Function) {
    this._setFooterInfo = setInfo;
  }

  setHeaderInfo(info: any) {
    if (typeof this._setHeaderInfo === 'function') {
      this._setHeaderInfo(info);
    }
  }

  setFooterInfo(info: any) {
    if (typeof this._setFooterInfo === 'function') {
      this._setFooterInfo(info);
    }
  }
}

export default Manager;
