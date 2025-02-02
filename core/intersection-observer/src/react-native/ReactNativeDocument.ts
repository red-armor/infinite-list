import { RefObject } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';
import Emitter from './Emitter';

export type ScrollEventHandler = (
  e: NativeSyntheticEvent<NativeScrollEvent>
) => void;

/**
 * root should implement ReactNativeDocument
 */
abstract class ReactNativeDocument {
  abstract ownerDocument: ReactNativeDocument;
  abstract node: ScrollView | RefObject<ScrollView>;

  abstract addEventListener(
    type: string,
    listener: ScrollEventHandler,
    options?: boolean | AddEventListenerOptions
  ): {
    (): void;
  };
}

class ReactNativeDocumentBase extends ReactNativeDocument {
  readonly emitter = new Emitter();
  ownerDocument: ReactNativeDocument;
  node: ScrollView | RefObject<ScrollView>;

  constructor(props: {
    ownerDocument: ReactNativeDocument;
    node: ScrollView | RefObject<ScrollView>;
  }) {
    super();
    this.node = props.node;
    this.ownerDocument = props.ownerDocument;
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
}

export { ReactNativeDocumentBase };

export default ReactNativeDocument;
