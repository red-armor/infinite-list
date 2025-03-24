export interface IScrollHelper {
  addEventListener: (
    eventName: string,
    listener: Function
  ) => {
    (): void;
  };
  // removeEventListener: (eventName: string, listener: Function) => void;
}
