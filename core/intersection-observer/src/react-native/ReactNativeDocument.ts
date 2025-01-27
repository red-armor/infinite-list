import { ScrollView } from 'react-native';

abstract class ReactNativeDocument {
  abstract ownerDocument: ReactNativeDocument;
  abstract dom: ScrollView;

  abstract addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
}

export default ReactNativeDocument;
