# IntersectionObserver

```ts
interface IntersectionObserverConstructor {
  new (
    callback: IntersectionObserverCallback, 
    props: IntersectionObserverProps
  ): IntersectionObserverInterface
}
```

## props

### enableIntersectionObserver

- Type: `boolean`
- Default: `false`

## methods

### observe

```ts
type observe = (el: ObservedComponent, options: ObserveOptions) => {
  observer: Observer;
  remover: () => void;
} 

type ObserveOptions = {
  observerKey: string;
  root: ReactNativeDocument;
  onRectChange?: OnRectChange;
};
```