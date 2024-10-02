import type { Meta } from '@storybook/react';
import { defaultKeyExtractor } from '@infinite-list/data-model';
import { List } from '../';

const buildData = (count: number) =>
  new Array(count).fill(1).map((v, index) => ({
    key: index,
  }));

const meta: Meta<typeof List> = {
  component: List,
  render: () => {
    return (
      <div
        style={{
          height: '400px',
          width: '600px',
          backgroundColor: '#efefef',
        }}
      >
        <List
          id="basic"
          initialNumToRender={4}
          data={buildData(10000)}
          recyclerBufferSize={100}
          recyclerReservedBufferPerBatch={50}
          renderItem={(props) => {
            const { item } = props;
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
          keyExtractor={defaultKeyExtractor}
        />
      </div>
    );
  },
  title: 'List',
};
export default meta;

export const SimpleList = {
  args: {
    data: buildData(100),
    keyExtractor: defaultKeyExtractor,
  },
};
