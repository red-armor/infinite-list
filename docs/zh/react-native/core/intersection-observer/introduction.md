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

```ts
const intersectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      console.log('IntersectionObserver: ', entry)
    }
  })
}, {
  root: marshal.ownerDocument,
  rootMargin: '0px',
  threshold: 0,
})
```

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