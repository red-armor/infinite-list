import type { Meta } from '@storybook/react';
import { defaultKeyExtractor } from '@infinite-list/data-model';
import { MasonryList } from '../';

const buildData = (count: number) =>
  new Array(count).fill(1).map((v, index) => ({
    key: index,
  }));

const meta: Meta<typeof MasonryList> = {
  component: MasonryList,
  render: () => {
    return (
      <div
        style={{
          height: '400px',
          width: '600px',
          backgroundColor: '#efefef',
          position: 'relative',
        }}
      >
        <MasonryList
          id="basic"
          initialNumToRender={0}
          data={buildData(10000)}
          recyclerBufferSize={100}
          recyclerReservedBufferPerBatch={50}
          renderItem={(props) => {
            const { item, itemMeta } = props;

            const indexInfo = itemMeta.getIndexInfo();
            const index = indexInfo?.index || 0;

            return (
              <div
                style={{
                  height: index % 2 ? '50px' : '75px',
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
          keyExtractor={defaultKeyExtractor}
        />
      </div>
    );
  },
  title: 'MasonryList',
};
export default meta;

export const SimpleMasonryList = {
  args: {
    data: buildData(100),
    keyExtractor: defaultKeyExtractor,
  },
};
