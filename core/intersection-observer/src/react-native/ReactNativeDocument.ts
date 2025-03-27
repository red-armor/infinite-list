import type { RefObject } from 'react';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';

import Emitter from './Emitter';
import type {
  OnIntersectionChange,
  ReactNativeDocumentBaseProps,
  ReactNativeDocumentNode,
  ScrollEventHandler} from './types';
import {
  ReactNativeDocument
} from './types';

export function getNode(node: ReactNativeDocumentNode) {
  return (node as RefObject<ScrollView>)?.current || (node as ScrollView);
}

class ReactNativeDocumentBase extends ReactNativeDocument {
  readonly id: string;
  readonly emitter = new Emitter();
  ownerDocument?: ReactNativeDocument | null;
  node: ReactNativeDocumentNode;
  horizontal: boolean;
  bidirectional: boolean;
  onIntersectionChange?: OnIntersectionChange;

  constructor(props: ReactNativeDocumentBaseProps) {
    super();
    const {
      node,
      id,
      horizontal = false,
      bidirectional = false,
      ownerDocument,
      onIntersectionChange,
    } = props;
    this.node = node;
    this.id = id;
    this.onIntersectionChange = onIntersectionChange;
    this.horizontal = horizontal;
    this.bidirectional = bidirectional;
    this.ownerDocument = ownerDocument;
  }

  addEventListener(
    type: string,
    listener: ScrollEventHandler,
    options?: boolean | AddEventListenerOptions
  ): () => void {
    return this.emitter.on(type, listener);
  }

  addScrollEventChangeListener(cb: ScrollEventHandler) {
    return this.emitter.on('on-scroll-event-change', cb);
  }

  onScrollEventChange(scrollEvent: NativeSyntheticEvent<NativeScrollEvent>) {
    this.emitter.fire('on-scroll-event-change', scrollEvent);
  }

  // onScroll(scrollEvent: NativeSyntheticEvent<NativeScrollEvent>) {
  //   this.emitter.fire('onScroll', scrollEvent);
  // }
  // onScrollEndDrag(scrollEvent: NativeSyntheticEvent<NativeScrollEvent>) {
  //   this.emitter.fire('onScrollEndDrag', scrollEvent);
  // }
  // onMomentumScrollEnd(scrollEvent: NativeSyntheticEvent<NativeScrollEvent>) {
  //   this.emitter.fire('onMomentumScrollEnd', scrollEvent);
  // }
}

export { ReactNativeDocumentBase };



export {ReactNativeDocument as default} from './types';