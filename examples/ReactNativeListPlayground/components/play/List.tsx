import { List } from '@infinite-list/list/react-native';
import { ScrollView } from '@infinite-list/scroller/react-native';
import { useCallback, useMemo, useRef } from 'react';
import type { ScrollView as NativeScrollView} from 'react-native';
import { Text, View } from 'react-native';

const buildData = (count: number, startIndex = 0) =>
  new Array(count).fill(1).map((v, index) => ({
    key: `__Key_${index + startIndex}`,
    value: index + startIndex,
  }));

export default () => {
  const data = useMemo(() => buildData(1000), []);
  const scrollViewRef = useRef<NativeScrollView>(null);

  const renderItem = useCallback((props: { item }) => {
    const { item, itemMeta } = props;
    if (itemMeta.getState().viewable)
      console.log(
        'item meta',
        itemMeta.getKey(),
        itemMeta.getState().viewable
      );

    return (
      <View style={{ height: 90, width: '100%', backgroundColor: '#fff' }}>
        <Text>{item.value}</Text>
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item) => {
    return item.key;
  }, []);

  return (
    <ScrollView
      onLayout={(e) => {
        console.log('onLayout inner', e.nativeEvent.layout);
      }}
      onContentSizeChange={(width, height) => {
        console.log('onContentSizeChange inner', width, height);
      }}
      ref={scrollViewRef}
      contentContainerStyle={{
        backgroundColor: '#fff',
      }}
      onScrollEndDrag={(e) => {
        console.log('onScrollEndDrag', e.nativeEvent.contentOffset.y);
      }}
    >
      <View
        style={{
          height: 300,
        }}
      />
      <List
        data={data}
        renderItem={renderItem}
        id="basic"
        scrollerRef={scrollViewRef}
        keyExtractor={keyExtractor}
      />
    </ScrollView>
  );
};
