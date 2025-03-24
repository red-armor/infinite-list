declare module 'Iterable' {
  export function is<T = any>(thing: any): thing is Iterable<T>;
}
