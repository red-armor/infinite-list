class Manager {
  private _setHeaderInfo: ((info: any) => void) | null;
  private _setFooterInfo: ((info: any) => void) | null;

  constructor() {
    this._setHeaderInfo = null;
    this._setFooterInfo = null;
  }

  registerHeaderInfoSetter(setInfo: (info: any) => void) {
    this._setHeaderInfo = setInfo;
  }

  registerFooterInfoSetter(setInfo: (info: any) => void) {
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
