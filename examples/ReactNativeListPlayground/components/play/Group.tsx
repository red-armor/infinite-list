import { GroupList,ListGroup } from '@infinite-list/group/react-native';
import {
  ScrollView,
  ScrollViewContext,
} from '@infinite-list/scroller/react-native';
import { useCallback, useEffect,useRef } from 'react';
import type { ScrollView as NativeScrollView} from 'react-native';
import {Text, View } from 'react-native';

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
    const { item, itemMeta, ...rest } = props;

    const initRef = useRef(true);
    const itemMetaRef = useRef(itemMeta);

    if (itemMetaRef.current !== itemMeta) {
      itemMetaRef.current = itemMeta;
    }

    if (itemMeta.getState().viewable)
      console.log(
        'item meta',
        itemMeta.getKey(),
        itemMeta.getState().viewable
      );

    useEffect(() => {
      return () => {
        console.log('unmount ------------------');
      };
    }, []);

    useEffect(() => {
      if (initRef.current) console.log('mount', itemMeta.getKey());
      else {
        console.log('update to', itemMeta.getKey());
      }

      initRef.current = false;

      return () => {
        console.log(
          'unmount',
          itemMeta.getKey(),
          itemMetaRef.current.getKey()
        );
      };
    }, [itemMeta]);

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
        <View
          style={{
            height: 340,
          }}
        />

        <ListGroup
          id="basic"
          containerRef={scrollViewRef}
          recyclerBufferSize={100}
          recyclerReservedBufferPerBatch={50}
          initialNumToRender={10}
          scrollComponentContext={ScrollViewContext}
        >
          <GroupList
            id="first"
            data={buildData(500)}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
          />

          <GroupList<Item>
            id="second"
            data={buildData(500, 500)}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
          />
        </ListGroup>
      </ScrollView>
    </View>
  );
};
