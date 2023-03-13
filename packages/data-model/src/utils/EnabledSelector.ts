class EnabledSelector {
  private _dispatchScrollMetricsEnabled = true;

  getDispatchScrollMetricsStatus() {
    return this._dispatchScrollMetricsEnabled
  }

  setDispatchScrollMetricsStatus(value: boolean) {
    this._dispatchScrollMetricsEnabled = value;
  }

  enableDispatchScrollMetrics() {
    this._dispatchScrollMetricsEnabled = true
  }

  disableDispatchScrollMetrics() {
    this._dispatchScrollMetricsEnabled = false
  }
}

export default EnabledSelector