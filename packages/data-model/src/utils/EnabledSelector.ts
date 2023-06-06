class EnabledSelector {
  private _dispatchScrollMetricsEnabled = true;
  private _onEnabled?: Function;

  constructor(props?: { onEnabled?: Function }) {
    const { onEnabled } = props || {};
    this._onEnabled = onEnabled;
  }

  getDispatchScrollMetricsEnabledStatus() {
    return this._dispatchScrollMetricsEnabled;
  }

  setDispatchScrollMetricsEnabledStatus(value: boolean) {
    if (this._dispatchScrollMetricsEnabled !== value) {
      if (value) this.enableDispatchScrollMetrics();
      else this.disableDispatchScrollMetrics();
    }
  }

  enableDispatchScrollMetrics() {
    this._dispatchScrollMetricsEnabled = true;
    if (typeof this._onEnabled === 'function') {
      this._onEnabled.call(this);
    }
  }

  disableDispatchScrollMetrics() {
    this._dispatchScrollMetricsEnabled = false;
  }

  toggleDispatchScrollMetrics() {
    if (!this._dispatchScrollMetricsEnabled) this.enableDispatchScrollMetrics();
    else this.disableDispatchScrollMetrics();
  }
}

export default EnabledSelector;
