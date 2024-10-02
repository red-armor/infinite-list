class ScrollTracker {
  private _domNode: HTMLElement;
  private _onScroll?: (e: Event) => void;
  private _onScrollEnd?: (e: Event) => void;

  private _scrollMetrics: {
    offset: number;
    visibleLength: number;
    contentLength: number;

    velocity?: number;
  };
  private _deltaY: number;
  // private _lastScrollY: number
  // private _lastScrollTs: number

  private _lastFrameTimestamp: number;
  private _lastFrameScrollY: number;

  // private _accumulatedDeltaX: number
  // private _accumulatedDeltaY: number
  private _trackId?: NodeJS.Timeout;
  private _velocity: number;
  readonly velocityTrackerTimeout: number;

  constructor(props: {
    domNode: HTMLElement;
    velocityTrackerTimeout?: number;
    onScroll?: (e: Event) => void;
    onScrollEnd?: (e: Event) => void;
  }) {
    const {
      domNode,
      onScroll,
      onScrollEnd,
      velocityTrackerTimeout = 16,
    } = props;
    this._domNode = domNode;
    this._onScroll = onScroll;
    this._onScrollEnd = onScrollEnd;

    this.onScroll = this.onScroll.bind(this);
    this.onScrollEnd = this.onScrollEnd.bind(this);
    this._scrollMetrics = {
      offset: 0,
      visibleLength: this._domNode.height || 0,
      contentLength: 0,
    };

    this._deltaY = 0;
    this._velocity = 0;
    this._lastFrameScrollY = 0;
    this._lastFrameTimestamp = 0;
    this.velocityTrackerTimeout = velocityTrackerTimeout;
  }

  dispose() {
    this._domNode.removeEventListener('scroll', this.onScroll);
  }

  addEventListeners() {
    this.addListener();
  }

  addListener() {
    this._domNode.addEventListener('scroll', this.onScroll);
    this._domNode.addEventListener('scrollend', this.onScrollEnd);
  }

  getScrollMetrics() {
    return this._scrollMetrics;
  }

  track() {
    const currentOffset = this._domNode.scrollTop;
    const currentTs = Date.now();

    const deltaY = currentOffset - this._lastFrameScrollY;
    const deltaTs = currentTs - this._lastFrameTimestamp;

    this._lastFrameScrollY = currentOffset;
    this._lastFrameTimestamp = currentTs;

    this._velocity = deltaY / deltaTs;
    this._trackId = undefined;
  }

  onScroll(e: Event) {
    const offset = this._domNode.scrollTop;
    const visibleLength = this._domNode.clientHeight;
    const contentLength = this._domNode.scrollHeight;

    if (!this._lastFrameTimestamp) {
      this._lastFrameScrollY = offset;
      this._lastFrameTimestamp = Date.now();
    }

    if (!this._trackId) {
      this._trackId = setTimeout(() => {
        this.track();
      }, this.velocityTrackerTimeout);
    }

    this._scrollMetrics = {
      offset,
      visibleLength,
      contentLength,
      velocity: this._velocity,
    };

    if (typeof this._onScroll === 'function') {
      this._onScroll(e);
    }
  }

  onScrollEnd(e: Event) {
    if (typeof this._onScrollEnd === 'function') this._onScrollEnd(e);

    if (this._trackId) {
      clearInterval(this._trackId);
      this._trackId = undefined;
      this._lastFrameScrollY = this._domNode.scrollTop;
      this._lastFrameTimestamp = 0;
    }
  }
}

export default ScrollTracker;
