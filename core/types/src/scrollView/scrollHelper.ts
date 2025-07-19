export interface IScrollHelper {
  addEventListener: (
    eventName: string,
    listener: (...args: unknown[]) => void
  ) => {
    (): void;
  };
  // removeEventListener: (eventName: string, listener: Function) => void;
}
