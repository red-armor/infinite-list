export type EventProps = {
  onWillAddFirstListener?: TheFunction;
  onDidAddFirstListener?: TheFunction;

  onDidAddListener?: TheFunction;

  onWillRemoveListener?: TheFunction;

  onDidRemoveLastListener?: TheFunction;

  coldTrigger?: boolean;
};

export type EventListener<T = any> = (() => void) | ((a1: T, a2: T) => void);

// export type EventListener<T = any> = {
//   (args: T | null): void;
// };

export type TheFunction = () => void;
