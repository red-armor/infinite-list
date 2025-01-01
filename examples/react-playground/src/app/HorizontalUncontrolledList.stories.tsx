import type { Meta } from '@storybook/react';
import { useRef } from 'react';
import { defaultKeyExtractor } from '@infinite-list/utils';
import { List } from '@infinite-list/list/react';

const buildData = (count: number) =>
  new Array(count).fill(1).map((v, index) => ({
    key: `${index}`,
  }));

const meta: Meta<typeof List> = {
  component: List,
  render: (props) => {
    const { data, keyExtractor } = props;
    const scrollerRef = useRef<HTMLDivElement>(null);

    return (
      <div
        ref={scrollerRef}
        style={{
          height: '300px',
          width: '600px',
          backgroundColor: '#efefef',
          position: 'relative',
        }}
      >
        <List
          id="basic"
          initialNumToRender={0}
          data={data}
          horizontal
          recyclerBufferSize={100}
          recyclerReservedBufferPerBatch={50}
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
                  height: '100%',
                  width: '200px',
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

export const HorizontalUncontrolledList = {
  args: {
    data: buildData(100),
    keyExtractor: defaultKeyExtractor,
  },
};
