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

export type ReactNativeDocumentNode = ScrollView | RefObject<ScrollView>;

/**
 * root should implement ReactNativeDocument
 */
abstract class ReactNativeDocument {
  abstract id: string;
  abstract ownerDocument: ReactNativeDocument;
  abstract node: ReactNativeDocumentNode;

  abstract addEventListener(
    type: string,
    listener: ScrollEventHandler,
    options?: boolean | AddEventListenerOptions
  ): {
    (): void;
  };
}

class ReactNativeDocumentBase extends ReactNativeDocument {
  readonly id: string;
  readonly emitter = new Emitter();
  ownerDocument: ReactNativeDocument;
  node: ReactNativeDocumentNode;

  constructor(props: {
    id: string;
    /**
     * the closest parent document not top most document !!!
     */
    ownerDocument: ReactNativeDocument;
    node: ReactNativeDocumentNode;
  }) {
    super();
    this.node = props.node;
    this.id = props.id;
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
