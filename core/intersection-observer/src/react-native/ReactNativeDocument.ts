import { ScrollView } from 'react-native';

/**
 * root should implement ReactNativeDocument
 */
abstract class ReactNativeDocument {
  abstract ownerDocument: ReactNativeDocument;
  abstract node: ScrollView;

  abstract addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): {
    (): void;
  };
}

export default ReactNativeDocument;
