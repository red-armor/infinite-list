class RefreshControlService {
  private _refreshControl: any;
  public setRefreshControl(refreshControl: any) {
    this._refreshControl = refreshControl;
  }
  public getRefreshControl() {
    return this._refreshControl;
  }
}
