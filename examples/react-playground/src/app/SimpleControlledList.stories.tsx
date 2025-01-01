import type { Meta } from '@storybook/react';
import {
  defaultKeyExtractor,
  // type KeyExtractor,
} from '@infinite-list/utils';
import { List } from '@infinite-list/list/react';
import { useRef } from 'react';

const buildData = (count: number) =>
  new Array(count).fill(1).map((v, index) => ({
    key: `${index}`,
  }));

const meta: Meta<typeof List> = {
  component: List,
  render: (props) => {
    const { data, keyExtractor } = props;
    const containerRef = useRef<HTMLDivElement>(null);
    return (
      <div
        ref={containerRef}
        style={{
          height: '400px',
          width: '600px',
          backgroundColor: '#efefef',
          position: 'relative',
          overflowY: 'auto',
        }}
      >
        <div style={{ height: '300px' }}></div>
        <List
          id="basic"
          initialNumToRender={0}
          data={data}
          recyclerBufferSize={100}
          recyclerReservedBufferPerBatch={50}
          persistenceIndices={[0, 10, 2]}
          scrollerRef={containerRef}
          renderItem={(props) => {
            const { item, itemMeta } = props;
            if (itemMeta.getState().viewable)
              console.log(
                'item meta ',
                itemMeta.getKey(),
                itemMeta.getState().viewable
              );

            return (
              <div
                style={{
                  height: '50px',
                  width: '100%',
                  backgroundColor: '#efdbff',
                  paddingBottom: '5px',
                  boxSizing: 'border-box',
                }}
              >
                {item.key}
              </div>
            );
          }}
          keyExtractor={keyExtractor}
        />
      </div>
    );
  },
  title: 'List',
};
export default meta;

export const SimpleControlledList = {
  args: {
    data: buildData(500),
    keyExtractor: defaultKeyExtractor,
  },
};
