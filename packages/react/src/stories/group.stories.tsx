import type { Meta } from '@storybook/react';
import {
  defaultKeyExtractor,
  type KeyExtractor,
} from '@infinite-list/data-model';
import { ListGroup, GroupList, RenderItem, RenderItemInfo } from '../';

type Item = {
  key: string;
};

const buildData = (count: number, startIndex = 0) =>
  new Array(count).fill(1).map((v, index) => ({
    key: index + startIndex,
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
            data={buildData(100)}
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
            keyExtractor={defaultKeyExtractor as KeyExtractor<{ key: number }>}
          />

          <GroupList
            id="second"
            initialNumToRender={0}
            data={buildData(100, 100)}
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
            keyExtractor={defaultKeyExtractor as KeyExtractor<{ key: number }>}
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
