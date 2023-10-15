import React, {
  useEffect,
  useMemo,
  memo,
  useState,
  PropsWithChildren,
} from 'react';
import { RecycleStateResult } from '@infinite-list/data-model';
import {
  PortalContextProps,
  GroupRecycleContentProps,
  GroupSpaceContentProps,
} from '../types';
import { View, ViewStyle } from 'react-native';

import GroupListItemImpl from './GroupListItemImpl';

const RecycleContentItem = (props) => {
  const {
    listKey,
    itemMeta,
    dimensions,
    item,
    offset,
    containerKey,
    horizontal,
    scrollComponentUseMeasureLayout,
  } = props;

  const containerStyle: ViewStyle = useMemo(
    () =>
      horizontal
        ? {
            position: 'absolute',
            left: offset,
            top: 0,
            bottom: 0,
          }
        : {
            position: 'absolute',
            top: offset,
            left: 0,
            right: 0,
          },
    [offset]
  );

  return (
    <View style={containerStyle}>
      <GroupListItemImpl
        item={item}
        style={containerStyle}
        listKey={listKey}
        itemMeta={itemMeta}
        renderItem={itemMeta._owner.renderItem}
        containerKey={containerKey}
        dimensions={dimensions}
        scrollComponentUseMeasureLayout={scrollComponentUseMeasureLayout}
      />
    </View>
  );
};

const MemoedRecycleContentItem = memo(RecycleContentItem);

const RecycleContent = <T extends {}>(props: GroupRecycleContentProps<T>) => {
  const { state, ...rest } = props;
  return (
    <>
      {state.map((stateResult) => {
        const { key, itemMeta, ...stateResultRest } = stateResult;
        return (
          <MemoedRecycleContentItem
            key={key}
            containerKey={key}
            // @ts-ignore
            renderItem={itemMeta._owner.renderItem}
            itemMeta={itemMeta}
            {...rest}
            {...stateResultRest}
          />
        );
      })}
    </>
  );
};
const MemoedRecycleContent = memo<
  PropsWithChildren<GroupRecycleContentProps<any>>
>(RecycleContent, (prev, next) => prev.state === next.state);

const SpaceContent = <T extends {}>(props: GroupSpaceContentProps<T>) => {
  const { state, listKey, dimensions, scrollComponentUseMeasureLayout } = props;

  return (
    <>
      {state.map((stateResult, index) => {
        const { isSpace, key, item, length, isSticky, itemMeta } = stateResult;
        return isSpace ? (
          <View key={key} style={{ height: length }} />
        ) : (
          <GroupListItemImpl
            item={item}
            key={key}
            listKey={listKey}
            itemMeta={itemMeta}
            // @ts-ignore
            renderItem={itemMeta.getOwner().renderItem}
            dimensions={dimensions}
            scrollComponentUseMeasureLayout={scrollComponentUseMeasureLayout}
          />
        );
      })}
    </>
  );
};
const MemoedSpaceContent = memo<PropsWithChildren<GroupSpaceContentProps<any>>>(
  SpaceContent,
  (prev, next) => prev.state === next.state
);

const PortalContent = <T extends {}>(
  props: PropsWithChildren<PortalContextProps>
) => {
  const { listGroupDimensions, id, scrollComponentUseMeasureLayout } = props;
  const [store, setStore] = useState(
    () => listGroupDimensions.getStateResult() as any as RecycleStateResult<T>
  );

  useEffect(
    () =>
      listGroupDimensions.addStateListener((newState) => {
        setTimeout(() => setStore(newState as any as RecycleStateResult<T>));
      }),
    []
  );

  return (
    <>
      <MemoedSpaceContent
        listKey={id}
        ownerId={id}
        state={store.spaceState}
        dimensions={listGroupDimensions}
        scrollComponentUseMeasureLayout={scrollComponentUseMeasureLayout}
      />

      <MemoedRecycleContent
        listKey={id}
        ownerId={id}
        state={store.recycleState}
        dimensions={listGroupDimensions}
        scrollComponentUseMeasureLayout={scrollComponentUseMeasureLayout}
      />
    </>
  );
};

export default React.memo(PortalContent);
