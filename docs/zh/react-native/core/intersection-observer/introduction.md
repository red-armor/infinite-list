# IntersectionObserver

- Type

```ts
interface IntersectionObserverConstructor {
  new (
    callback: IntersectionObserverCallback, 
    props: IntersectionObserverProps
  ): IntersectionObserverInterface
}
```

- Example


## Props

### enableIntersectionObserver

- Type: `boolean`
- Default: `false`

## Methods

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

## More
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver)