import { useCallback, useMemo, useRef } from 'react';
import { List } from '@infinite-list/list';
import { ScrollView } from '@infinite-list/scroller';
import { ScrollView as NativeScrollView, Text, View } from 'react-native';

const buildData = (count: number, startIndex = 0) =>
  new Array(count).fill(1).map((v, index) => ({
    key: `__Key_${index + startIndex}`,
    value: index + startIndex,
  }));

export default () => {
  const data = useMemo(() => buildData(10000), []);
  const scrollViewRef = useRef<NativeScrollView>(null);

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
      contentContainerStyle={{
        backgroundColor: '#fff',
      }}
    >
      <List
        data={data}
        renderItem={renderItem}
        id="basic"
        keyExtractor={keyExtractor}
        containerRef={scrollViewRef}
      />
    </ScrollView>
  );
};
