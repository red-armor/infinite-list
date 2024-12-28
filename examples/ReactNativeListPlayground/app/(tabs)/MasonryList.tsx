import { useCallback, useMemo, useRef } from 'react';
import { ScrollView as NativeScrollView } from 'react-native';
// import { MasonryList, ScrollView } from '@infinite-list/react-native';
import { MasonryList } from '@infinite-list/masonry';
import { ScrollView } from '@infinite-list/scroller';
import { Text, View } from 'react-native';

const buildData = (count: number, startIndex = 0) =>
  new Array(count).fill(1).map((v, index) => ({
    key: index + startIndex,
    value: index + startIndex,
  }));

export default () => {
  const data = useMemo(() => buildData(10000), []);
  const scrollViewRef = useRef<NativeScrollView>(null);

  const renderItem = useCallback((props: { item }) => {
    const { item, itemMeta } = props;
    const index = itemMeta.getIndexInfo().index;
    const totalIndex = itemMeta.getIndexInfo().indexInTotal;

    return (
      <View
        style={{
          height: totalIndex % 3 ? 50 : 75,
          flex: 1,
          width: '100%',
          backgroundColor: index % 2 ? '#fff' : '#eee',
        }}
      >
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
      <MasonryList
        data={data}
        renderItem={renderItem}
        id="basic"
        recyclerBufferSize={100}
        recyclerReservedBufferPerBatch={50}
        keyExtractor={keyExtractor}
        containerRef={scrollViewRef}
      />
    </ScrollView>
  );
};
