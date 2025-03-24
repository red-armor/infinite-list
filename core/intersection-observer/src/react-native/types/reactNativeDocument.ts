import { RefObject } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';
import { IClientRectReadOnly } from '../../types';

export type ScrollEventHandler = (
  e: NativeSyntheticEvent<NativeScrollEvent>
) => void;

export type ReactNativeDocumentNode = ScrollView | RefObject<ScrollView>;
export type OnIntersectionChange = (
  newIntersection: IClientRectReadOnly | null,
  oldIntersection?: IClientRectReadOnly | null
) => void;

export type ReactNativeDocumentBaseProps = {
  horizontal?: boolean;
  bidirectional?: boolean;
  id: string;
  /**
   * the closest parent document not top most document!!!
   */
  ownerDocument?: ReactNativeDocument | null;
  node: ReactNativeDocumentNode;

  /**
   * onIntersectionChange is called when the intersection of this document
   * with the root document changes.
   */
  onIntersectionChange?: OnIntersectionChange;
};

/**
 * root should implement ReactNativeDocument
 */
export abstract class ReactNativeDocument {
  abstract id: string;
  abstract ownerDocument?: ReactNativeDocument | null;
  abstract node: ReactNativeDocumentNode;
  abstract horizontal?: boolean;

  /**
   * can scroll on horizontal or vertical, it only works on web condition
   */
  abstract bidirectional?: boolean;

  abstract onIntersectionChange?: OnIntersectionChange;

  // abstract addEventListener(
  //   type: string,
  //   listener: ScrollEventHandler,
  //   options?: boolean | AddEventListenerOptions
  // ): {
  //   (): void;
  // };

  abstract addScrollEventChangeListener(cb: ScrollEventHandler): {
    (): void;
  };
}
