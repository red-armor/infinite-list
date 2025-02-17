export interface IDisposable {
  dispose: DisposableFunction;
}

export type DisposableFunction = {
  (): void;
};
