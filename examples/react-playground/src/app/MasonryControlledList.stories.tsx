import type { KeyExtractor } from '@infinite-list/dimensions-model';
import { MasonryList } from '@infinite-list/masonry/react';
import { defaultKeyExtractor } from '@infinite-list/utils';
import type { Meta } from '@storybook/react';
import { useRef } from 'react';

type Item = {
  key: string;
};

const buildData = (count: number) =>
  new Array(count).fill(1).map((v, index) => ({
    key: `${index}`,
  }));

const meta: Meta<typeof MasonryList> = {
  component: MasonryList,
  render: () => {
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
        <MasonryList
          id="basic"
          scrollerRef={containerRef}
          data={buildData(10000)}
          recyclerBufferSize={100}
          recyclerReservedBufferPerBatch={50}
          renderItem={(props) => {
            const { item, itemMeta } = props;
            const indexInfo = itemMeta.getIndexInfo();
            const index = indexInfo?.index || 0;

            if (itemMeta.getState().viewable)
              console.log(
                'item meta',
                itemMeta.getKey(),
                itemMeta.getState().viewable
              );
            return (
              <div
                style={{
                  height: index % 2 ? '50px' : index % 3 ? 60 : '75px',
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
          keyExtractor={defaultKeyExtractor as KeyExtractor<Item>}
        />
      </div>
    );
  },
  title: 'MasonryList',
};
export default meta;

export const MasonryControlledList = {
  args: {
    data: buildData(100),
    keyExtractor: defaultKeyExtractor,
  },
};
