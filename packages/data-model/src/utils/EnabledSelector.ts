class EnabledSelector {
  private _dispatchScrollMetricsEnabled = true;

  getDispatchScrollMetricsEnabledStatus() {
    return this._dispatchScrollMetricsEnabled;
  }

  setDispatchScrollMetricsEnabledStatus(value: boolean) {
    this._dispatchScrollMetricsEnabled = value;
  }

  enableDispatchScrollMetrics() {
    this._dispatchScrollMetricsEnabled = true;
  }

  disableDispatchScrollMetrics() {
    this._dispatchScrollMetricsEnabled = false;
  }
}

export default EnabledSelector;
