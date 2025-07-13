import { ScrollTrackerProps, TDomNode } from './types';

class ScrollTracker {
  private _domNode: TDomNode;
  private _onScroll?: (e: Event) => void;
  private _onScrollEnd?: (e: Event) => void;

  private _scrollMetrics: {
    offset: number;
    visibleLength: number;
    contentLength: number;

    velocity?: number;
  };
  private domNode: HTMLDivElement;
  readonly _deltaY: number;
  private _horizontal: boolean;
  // private _lastScrollY: number
  // private _lastScrollTs: number

  private _lastFrameTimestamp: number;
  private _lastFrameScrollY: number;

  // private _accumulatedDeltaX: number
  // private _accumulatedDeltaY: number
  private _trackId?: NodeJS.Timeout;
  private _velocity: number;
  readonly velocityTrackerTimeout: number;

  constructor(props: ScrollTrackerProps) {
    const {
      domNode,
      onScroll,
      horizontal,
      onScrollEnd,
      velocityTrackerTimeout = 16,
    } = props;
    this._horizontal = !!horizontal;
    this._domNode = domNode;

    this._onScroll = onScroll;
    this._onScrollEnd = onScrollEnd;

    this.domNode = this._domNode as HTMLDivElement;

    // @ts-expect-error TODO: fix this
    if (this._domNode instanceof HTMLDivElement) {
      this.domNode = this._domNode;
      // @ts-expect-error TODO: fix this
    } else if (this._domNode?.current) {
      // @ts-expect-error TODO: fix this

      this.domNode = this._domNode?.current;
    }

    this.onScroll = this.onScroll.bind(this);
    this.onScrollEnd = this.onScrollEnd.bind(this);
    this._scrollMetrics = {
      offset: 0,
      visibleLength: this.selectVisibleLength() || 0,
      contentLength: 0,
    };

    this._deltaY = 0;
    this._velocity = 0;
    this._lastFrameScrollY = 0;
    this._lastFrameTimestamp = 0;
    this.velocityTrackerTimeout = velocityTrackerTimeout;
  }

  // get domNode(): HTMLDivElement {

  //   if (this._domNode instanceof HTMLDivElement) {
  //     return this._domNode;
  //   }
  //   if (this._domNode?.current) return this._domNode.current;
  //   return this._domNode as any as HTMLDivElement;
  // }

  dispose() {
    // @ts-expect-error TODO: fix this

    this.domNode.removeEventListener('scroll', this.onScroll);
  }

  addEventListeners() {
    this.addListener();
  }

  addListener() {
    // @ts-expect-error TODO: fix this

    this.domNode.addEventListener('scroll', this.onScroll);
    // @ts-expect-error TODO: fix this

    this.domNode.addEventListener('scrollend', this.onScrollEnd);
  }

  getScrollMetrics() {
    return this._scrollMetrics;
  }

  selectOffset(dom: HTMLElement) {
    // @ts-expect-error TODO: fix this

    if (this._horizontal) return dom.scrollLeft;
    // @ts-expect-error TODO: fix this

    return dom.scrollTop;
  }

  /**
   *
   * @param dom
   * @returns
   *
   * visibleLength should be direction sensitive
   */
  selectVisibleLength(dom: HTMLElement = this.domNode) {
    // @ts-expect-error TODO: fix this
    if (this._horizontal) return dom.clientWidth;
    // @ts-expect-error TODO: fix this
    return dom.clientHeight;
  }

  /**
   *
   * @param dom
   * @returns
   */
  selectContentLength(dom: HTMLElement = this.domNode) {
    // @ts-expect-error TODO: fix this
    if (this._horizontal) return dom.scrollWidth;
    // @ts-expect-error TODO: fix this
    return dom.scrollHeight;
  }

  track() {
    const currentOffset = this.selectOffset(this.domNode);
    const currentTs = Date.now();

    const deltaY = currentOffset - this._lastFrameScrollY;
    const deltaTs = currentTs - this._lastFrameTimestamp;

    this._lastFrameScrollY = currentOffset;
    this._lastFrameTimestamp = currentTs;

    this._velocity = deltaY / deltaTs;
    this._trackId = undefined;
  }

  onScroll(e: Event) {
    const offset = this.selectOffset(this.domNode);
    const visibleLength = this.selectVisibleLength();
    const contentLength = this.selectContentLength();

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
      this._lastFrameScrollY = this.selectOffset(this.domNode);
      this._lastFrameTimestamp = 0;
    }
  }
}

export default ScrollTracker;
