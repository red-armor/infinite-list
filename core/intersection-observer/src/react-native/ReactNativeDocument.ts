import { ScrollView } from 'react-native';

abstract class ReactNativeDocument {
  abstract ownerDocument: ReactNativeDocument;
  abstract node: ScrollView;

  abstract addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
}

export default ReactNativeDocument;
