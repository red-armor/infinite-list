import React, { useCallback, useState, useRef } from 'react';
import type { Meta } from '@storybook/react';
import { defaultKeyExtractor } from '@infinite-list/data-model';
import { List } from '..';

const buildData = (count: number, startIndex = 0) =>
  new Array(count).fill(1).map((v, index) => ({
    key: startIndex + index,
  }));

const fetchData = (startIndex: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(buildData(10, startIndex * 10));
    }, 200);
  });
};

const meta: Meta<typeof List> = {
  render: () => {
    const [data, setData] = useState([]);
    const pageRef = useRef(0);

    const onEndReached = useCallback(({ cb }) => {
      fetchData(pageRef.current).then((data) => {
        setData((current) => [].concat(current, data));
        cb();
        pageRef.current += 1;
      });
    }, []);

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
          data={data}
          recyclerBufferSize={100}
          onEndReached={onEndReached}
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
  title: 'OnEndReached',
};
export default meta;

export const SimpleList = {
  args: {
    data: buildData(100),
    keyExtractor: defaultKeyExtractor,
  },
};
