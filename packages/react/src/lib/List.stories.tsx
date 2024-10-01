import type { Meta } from '@storybook/react';
import { defaultKeyExtractor } from '@infinite-list/data-model';
import { List } from './List';

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
          height: '800px',
          width: '600px',
          backgroundColor: '#efefef',
        }}
      >
        <List
          id="basic"
          initialNumToRender={4}
          data={buildData(100)}
          renderItem={(props) => {
            const { item } = props;
            return (
              <div
                style={{
                  height: '50px',
                  width: '100%',
                  backgroundColor: '#efdbff',
                  paddingBottom: '5px',
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
