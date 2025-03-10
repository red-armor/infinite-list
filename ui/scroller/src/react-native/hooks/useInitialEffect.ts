import { useEffect, useRef } from 'react';

type Fn = { (): void };
type Disposer = Fn | undefined;

const useInitialEffect = (fn: { (): Disposer }) => {
  const isInitialRef = useRef(true);
  const disposerRef = useRef<Fn | null | undefined>(null);

  if (isInitialRef.current) {
    isInitialRef.current = false;
    disposerRef.current = fn();
  }

  useEffect(
    () => () => {
      if (disposerRef.current) {
        disposerRef.current();
      }
    },
    []
  );
};
export default useInitialEffect;
