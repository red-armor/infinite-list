import type { Meta } from '@storybook/react';
import { defaultKeyExtractor } from '@infinite-list/utils';
import { KeyExtractor } from '@infinite-list/dimensions-model';
import { RenderItemInfo } from '@infinite-list/types';

import { ListGroup, GroupList } from '@infinite-list/group/react';

type Item = {
  key: string;
};

const buildData = (count: number, startIndex = 0) =>
  new Array(count).fill(1).map((v, index) => ({
    key: `${index + startIndex}`,
  }));

const meta: Meta<typeof ListGroup> = {
  component: ListGroup,
  render: () => {
    return (
      <div
        style={{
          height: '400px',
          width: '600px',
          backgroundColor: '#efefef',
          position: 'relative',
          // overflowY: 'auto',
        }}
      >
        <ListGroup id="basic">
          <GroupList
            id="first"
            initialNumToRender={0}
            data={buildData(500)}
            recyclerBufferSize={100}
            recyclerReservedBufferPerBatch={50}
            renderItem={(props: RenderItemInfo<Item>) => {
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
            keyExtractor={defaultKeyExtractor as KeyExtractor<Item>}
          />

          <GroupList
            id="second"
            initialNumToRender={0}
            data={buildData(500, 500)}
            recyclerBufferSize={100}
            recyclerReservedBufferPerBatch={50}
            renderItem={(props: RenderItemInfo<Item>) => {
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
            keyExtractor={defaultKeyExtractor as KeyExtractor<Item>}
          />
        </ListGroup>
      </div>
    );
  },
  title: 'group',
};
export default meta;

export const SimpleListGroup = {
  args: {
    data: buildData(100),
    keyExtractor: defaultKeyExtractor,
  },
};
