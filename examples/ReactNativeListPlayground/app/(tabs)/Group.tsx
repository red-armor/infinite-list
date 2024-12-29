import { useRef, useCallback } from 'react';
import { View, Text, ScrollView as NativeScrollView } from 'react-native';

import { ScrollView, ScrollViewContext } from '@infinite-list/scroller';

import { ListGroup, GroupList } from '@infinite-list/group';

type Item = {
  key: string;
  value: string;
};

const buildData = (count: number, startIndex = 0) =>
  new Array(count).fill(1).map((v, index) => ({
    key: `_key_${index + startIndex}`,
    value: `${index + startIndex}`,
  }));

export default () => {
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
    <View>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{
          backgroundColor: 'green',
        }}
      >
        <ListGroup
          id="basic"
          containerRef={scrollViewRef}
          scrollComponentContext={ScrollViewContext}
        >
          <GroupList
            id="first"
            initialNumToRender={0}
            data={buildData(500)}
            recyclerBufferSize={100}
            recyclerReservedBufferPerBatch={50}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
          />

          <GroupList<Item>
            id="second"
            initialNumToRender={0}
            data={buildData(500, 500)}
            recyclerBufferSize={100}
            recyclerReservedBufferPerBatch={50}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
          />
        </ListGroup>
      </ScrollView>
    </View>
  );
};
