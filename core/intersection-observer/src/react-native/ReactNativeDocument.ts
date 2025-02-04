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

export function getNode(node: ReactNativeDocumentNode) {
  return (node as RefObject<ScrollView>)?.current || (node as ScrollView);
}
export type ReactNativeDocumentBaseProps = {
  horizontal?: boolean;
  bidirectional?: boolean;
  id: string;
  /**
   * the closest parent document not top most document!!!
   */
  ownerDocument?: ReactNativeDocument | null;
  node: ReactNativeDocumentNode;
};

/**
 * root should implement ReactNativeDocument
 */
abstract class ReactNativeDocument {
  abstract id: string;
  abstract ownerDocument?: ReactNativeDocument | null;
  abstract node: ReactNativeDocumentNode;
  abstract horizontal?: boolean;

  /**
   * can scroll on horizontal or vertical, it only works on web condition
   */
  abstract bidirectional?: boolean;

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
  ownerDocument?: ReactNativeDocument | null;
  node: ReactNativeDocumentNode;
  horizontal: boolean;
  bidirectional: boolean;

  constructor(props: ReactNativeDocumentBaseProps) {
    super();
    const {
      node,
      id,
      horizontal = false,
      bidirectional = false,
      ownerDocument,
    } = props;
    this.node = node;
    this.id = id;
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
}

export { ReactNativeDocumentBase };

export default ReactNativeDocument;
