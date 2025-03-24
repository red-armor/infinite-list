import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { DisposableService, Event } from '@infinite-list/disposable';
import { TaskRunner } from '@infinite-list/scheduler';

type RefreshControlState = {
  isRefreshing: boolean;
};
const RefreshControlThresholdValue = 100;

class RefreshControlService extends DisposableService<RefreshControlState> {
  _state: RefreshControlState;

  private _onScrollEvent = new Event<NativeSyntheticEvent<NativeScrollEvent>>({
    name: 'on-scroll',
  });
  onScroll = this._onScrollEvent.subscribe;

  private _onScrollBeginDragEvent = new Event<
    NativeSyntheticEvent<NativeScrollEvent>
  >({
    name: 'on-scroll-begin-drag',
  });
  onScrollBeginDrag = this._onScrollBeginDragEvent.subscribe;

  private _onScrollEndDragEvent = new Event<
    NativeSyntheticEvent<NativeScrollEvent>
  >({
    name: 'on-scroll-end-drag',
  });
  onScrollEndDrag = this._onScrollEndDragEvent.subscribe;

  private _scrollMetrics: NativeScrollEvent | null;

  private _readyToCheckRefreshing: boolean;

  private _checkRefreshingTask: TaskRunner;

  constructor(props?: { ownerService?: any }) {
    super();
    this._state = {
      isRefreshing: false,
    };
    // this.ownerService = props?.ownerService;

    this._scrollMetrics = null;

    this._readyToCheckRefreshing = false;

    this._checkRefreshingTask = new TaskRunner(
      this.checkRefreshing.bind(this),
      50
    );

    // this.registerDisposable(
    //   this.onStateChanged(this.onStateChangedHandler.bind(this))
    // );
  }

  /**
   * 冒泡刷新状态
   *
   * 因为children存在的前提是，parent肯定存在，所以这里面就直接调用parent的
   * setState方法就好，不需要在parent中进行listen的方式
   */
  bubbleRefreshingState() {
    // this.ownerService?.setState({
    //   isRefreshing: this._state.isRefreshing,
    // });
  }

  startRefreshing() {
    this.setState({
      isRefreshing: true,
    });
  }

  stopRefreshing() {
    this.setState({
      isRefreshing: false,
    });
  }

  // onStateChangedHandler(
  //   newState: RefreshControlState,
  //   oldState: RefreshControlState
  // ) {
  //   console.log('buble ----');
  //   // if (newState.isRefreshing !== oldState.isRefreshing) {
  //   //   this.bubbleRefreshingState();
  //   // }
  // }

  checkRefreshing() {
    if (this._scrollMetrics) {
      if (!this._readyToCheckRefreshing) return;
      const { contentOffset } = this._scrollMetrics;
      if (-contentOffset.y > RefreshControlThresholdValue) {
        this.setState((state) => ({
          ...state,
          isRefreshing: true,
        }));
      }
    }
  }

  setScrollMetrics(event: NativeSyntheticEvent<NativeScrollEvent>) {
    this._scrollMetrics = event.nativeEvent;
  }

  receiveOnScrollBeginDragEvent(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    this.setScrollMetrics(event);
    this._readyToCheckRefreshing = false;
    this._onScrollBeginDragEvent.fire(event);
  }

  receiveOnScrollEvent(event: NativeSyntheticEvent<NativeScrollEvent>) {
    this.setScrollMetrics(event);
    this._onScrollEvent.fire(event);
  }
  receiveOnScrollEndDragEvent(event: NativeSyntheticEvent<NativeScrollEvent>) {
    this.setScrollMetrics(event);
    this._readyToCheckRefreshing = true;
    this._onScrollEndDragEvent.fire(event);
    this._checkRefreshingTask.schedule();
  }
}

export default RefreshControlService;
