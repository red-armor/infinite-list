import { useCallback, useMemo, useRef } from 'react';
import { List, ScrollView } from '@infinite-list/react-native';
import {
  // NativeScrollEvent,
  // NativeSyntheticEvent,
  Text,
  View,
} from 'react-native';

const buildData = (count: number, startIndex = 0) =>
  new Array(count).fill(1).map((v, index) => ({
    key: index + startIndex,
    value: index + startIndex,
  }));

export default () => {
  const data = useMemo(() => buildData(10000), []);
  const scrollViewRef = useRef<ScrollView>(null);

  const renderItem = useCallback((props: { item }) => {
    const { item } = props;
    return (
      <View style={{ height: 80, width: '100%', backgroundColor: '#fff' }}>
        <Text>{item.value}</Text>
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item) => {
    return item.key;
  }, []);

  return (
    <ScrollView
      ref={scrollViewRef}
      // onScroll={onScroll}
      contentContainerStyle={{
        backgroundColor: '#fff',
      }}
    >
      <List
        data={data}
        renderItem={renderItem}
        test="3"
        id="basic"
        keyExtractor={keyExtractor}
        containerRef={scrollViewRef}
      />
    </ScrollView>
  );
};
