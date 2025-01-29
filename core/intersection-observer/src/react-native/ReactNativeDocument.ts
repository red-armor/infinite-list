import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';

export type ScrollEventHandler = (
  e: NativeSyntheticEvent<NativeScrollEvent>
) => void;

/**
 * root should implement ReactNativeDocument
 */
abstract class ReactNativeDocument {
  abstract ownerDocument: ReactNativeDocument;
  abstract node: ScrollView;

  abstract addEventListener(
    type: string,
    listener: ScrollEventHandler,
    options?: boolean | AddEventListenerOptions
  ): {
    (): void;
  };
}

export default ReactNativeDocument;
