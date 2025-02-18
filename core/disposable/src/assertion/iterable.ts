export function is<T = any>(thing: any): thing is Iterable<T> {
  return (
    thing &&
    typeof thing === 'object' &&
    typeof thing[Symbol.iterator] === 'function'
  );
}
