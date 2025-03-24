import { useCallback, useMemo, useRef } from 'react';
import { List } from '@infinite-list/list/react-native';
import { ScrollView } from '@infinite-list/scroller/react-native';
import {
  Dimensions,
  ScrollView as NativeScrollView,
  Text,
  View,
} from 'react-native';

const buildData = (count: number, startIndex = 0) =>
  new Array(count).fill(1).map((v, index) => ({
    key: `_key_${index + startIndex}`,
    value: index + startIndex,
  }));

export default () => {
  const data = useMemo(() => buildData(100), []);
  const scrollViewRef = useRef<NativeScrollView>(null);

  const renderItem = useCallback((props: { item }) => {
    const { item, itemMeta } = props;
    if (itemMeta.getState().viewable)
      console.log(
        'item meta ',
        itemMeta.getKey(),
        itemMeta.getState().viewable
      );
    return (
      <View style={{ height: '100%', width: 200, backgroundColor: 'yellow' }}>
        <Text>{item.value}</Text>
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item) => {
    return item.key;
  }, []);

  return (
    <View style={{ width: Dimensions.get('window').width }}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{
          backgroundColor: 'green',
          height: 300,
        }}
        style={{
          marginTop: 100,
        }}
        horizontal
      >
        <View style={{ width: 400 }} />
        <List
          data={data}
          id="basic"
          horizontal
          scrollerRef={scrollViewRef}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          containerRef={scrollViewRef}
        />
      </ScrollView>
    </View>
  );
};
