class ListSpyUtils {
  private _enableDispatchOnScroll = true;
  constructor() {}

  public getEnableDispatchOnScroll() {
    return this._enableDispatchOnScroll;
  }

  public setEnableDispatchOnScorll(enableDispatchOnScroll: boolean) {
    this._enableDispatchOnScroll = enableDispatchOnScroll;
  }
}

export default new ListSpyUtils();
