import { GroupList,ListGroup } from '@infinite-list/group/react';
import type { RenderItemInfo } from '@infinite-list/types';
import { defaultKeyExtractor } from '@infinite-list/utils';
import type { Meta } from '@storybook/react';

type Item = {
  key: string;
};

const buildData = (count: number, startIndex = 0) =>
  new Array(count).fill(1).map((v, index) => ({
    key: `${index + startIndex}`,
  }));

const renderItem = (props: RenderItemInfo<Item>) => {
  const { item, itemMeta } = props;
  if (itemMeta.getState().viewable)
    console.log('item meta', itemMeta.getKey(), itemMeta.getState().viewable);
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
};

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
        }}
      >
        <ListGroup
          id="basic"
          initialNumToRender={0}
          recyclerBufferSize={100}
          recyclerReservedBufferPerBatch={50}
        >
          <GroupList
            id="first"
            data={buildData(500)}
            renderItem={renderItem}
            keyExtractor={defaultKeyExtractor}
          />

          <GroupList
            id="second"
            data={buildData(500, 500)}
            renderItem={renderItem}
            keyExtractor={defaultKeyExtractor}
          />
        </ListGroup>
      </div>
    );
  },
  title: 'group',
};
export default meta;

export const GroupUncontrolledList = {
  args: {
    data: buildData(100),
    keyExtractor: defaultKeyExtractor,
  },
};
