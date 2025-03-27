import type { RenderItem } from '@infinite-list/masonry/react-native';
import { MasonryList } from '@infinite-list/masonry/react-native';
import { ScrollView } from '@infinite-list/scroller/react-native';
import { useCallback, useEffect,useMemo, useRef } from 'react';
import { Text, View } from 'react-native';

const buildData = (count: number, startIndex = 0) =>
  new Array(count).fill(1).map((v, index) => ({
    key: index + startIndex,
    value: index + startIndex,
  }));

export default () => {
  const data = useMemo(() => buildData(1500), []);
  const scrollViewRef = useRef<ScrollView>(null);

  const renderItem: RenderItem<{
    key: number;
    value: number;
  }> = useCallback((props) => {
    const { item, itemMeta } = props;
    const {index} = itemMeta.getIndexInfo();
    const totalIndex = itemMeta.getIndexInfo().indexInTotal;
    const initRef = useRef(true);

    useEffect(() => {
      if (initRef.current) console.log('mount', itemMeta.getKey());
      else {
        console.log('update to', itemMeta.getKey());
      }

      initRef.current = false;

      return () => {
        console.log('unmount', itemMeta.getKey());
      };
    }, [itemMeta]);

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
