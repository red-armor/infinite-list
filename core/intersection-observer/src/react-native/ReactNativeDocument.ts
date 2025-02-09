import { RefObject } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';
import Emitter from './Emitter';
import {
  ScrollEventHandler,
  ReactNativeDocumentNode,
  ReactNativeDocument,
  ReactNativeDocumentBaseProps,
  OnIntersectionChange,
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
  ): { (): void } {
    return this.emitter.on(type, listener);
  }

  onScroll(scrollEvent: NativeSyntheticEvent<NativeScrollEvent>) {
    this.emitter.fire('onScroll', scrollEvent);
  }
  onScrollEndDrag(scrollEvent: NativeSyntheticEvent<NativeScrollEvent>) {
    this.emitter.fire('onScrollEndDrag', scrollEvent);
  }
  onMomentumScrollEnd(scrollEvent: NativeSyntheticEvent<NativeScrollEvent>) {
    this.emitter.fire('onMomentumScrollEnd', scrollEvent);
  }
}

export { ReactNativeDocumentBase };

export default ReactNativeDocument;
