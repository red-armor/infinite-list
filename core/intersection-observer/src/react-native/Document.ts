abstract class ReactNativeDocument {
  abstract ownerDocument: ReactNativeDocument;
  // abstract onChange: (() => void) | null;

  abstract addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
}

export default ReactNativeDocument;
