# ScrollEvent

```ts
import { ScrollViewContext } from '@infinite-list/scroll/react-native';

const Page = () => {
  const { scrollTo, scrollEventHelper } = useContext(ScrollViewContext);

  useEffect(
    () =>
      scrollEventHelper.subscribeEventHandler('onMomentumScrollBegin', () => {
        isAutoScrollingRef.current = true;
        isScrolling = true;
      }),
    []
  );
};
```
