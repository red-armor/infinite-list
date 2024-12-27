import React, {
  useEffect,
  useMemo,
  memo,
  useState,
  PropsWithChildren,
  CSSProperties,
} from 'react';
import { GenericItemT, RecycleStateResult } from '@infinite-list/strategies';
import { genericMemo } from '../types';

import {
  PortalContextProps,
  GroupRecycleContentProps,
  GroupSpaceContentProps,
} from './types';

import GroupListItemImpl from '../common/GroupListItemImpl';

// @ts-ignore
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

  const containerStyle: CSSProperties = useMemo(
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
    <div style={containerStyle}>
      <GroupListItemImpl
        item={item}
        style={containerStyle}
        itemKey={listKey}
        itemMeta={itemMeta}
        renderItem={itemMeta.getOwner().renderItem}
        teleportItemProps={itemMeta.getOwner().teleportItemProps}
        containerKey={containerKey}
        dimensions={dimensions}
        scrollComponentUseMeasureLayout={scrollComponentUseMeasureLayout}
      />
    </div>
  );
};

const MemoedRecycleContentItem = memo(RecycleContentItem);

const MemoedRecycleContent = genericMemo(
  <ItemT extends GenericItemT>(props: GroupRecycleContentProps<ItemT>) => {
    const { state, ...rest } = props;
    return (
      <>
        {/* @ts-ignore */}
        {state.map((stateResult) => {
          const { key, itemMeta, ...stateResultRest } = stateResult;
          return (
            <MemoedRecycleContentItem
              key={key}
              containerKey={key}
              // @ts-ignore
              renderItem={itemMeta.getOwner().renderItem}
              itemMeta={itemMeta}
              {...rest}
              {...stateResultRest}
            />
          );
        })}
      </>
    );
  },
  (prev, next) => prev.state === next.state
);

const MemoedSpaceContent = genericMemo(
  <ItemT extends GenericItemT>(props: GroupSpaceContentProps<ItemT>) => {
    const { state, listKey, dimensions } = props;

    return (
      <>
        {state.map((stateResult, index) => {
          const { isSpace, key, item, length, isSticky, itemMeta } =
            stateResult;
          return isSpace ? (
            <div key={key} style={{ height: length }} />
          ) : (
            <GroupListItemImpl<ItemT>
              item={item!}
              key={key}
              // listKey={listKey}
              itemKey={listKey}
              itemMeta={itemMeta!}
              // @ts-ignore
              renderItem={itemMeta!.getOwner().renderItem}
              // @ts-ignore
              teleportItemProps={itemMeta!.getOwner().teleportItemProps}
              dimensions={dimensions}
            />
          );
        })}
      </>
    );
  },
  (prev, next) => prev.state === next.state
);

const PortalContent = <ItemT extends GenericItemT>(
  props: PropsWithChildren<PortalContextProps<ItemT>>
) => {
  const { listGroupDimensions, id } = props;
  const [store, setStore] = useState(
    () =>
      listGroupDimensions.getStateResult() as any as RecycleStateResult<ItemT>
  );

  useEffect(
    () =>
      listGroupDimensions.addStateListener((newState) => {
        setStore(newState as any as RecycleStateResult<ItemT>);
      }),
    []
  );

  return (
    <>
      <MemoedSpaceContent<ItemT>
        listKey={id}
        ownerId={id}
        state={store.spaceState}
        dimensions={listGroupDimensions}
      />

      <MemoedRecycleContent
        listKey={id}
        ownerId={id}
        // @ts-ignore
        state={store.recycleState}
        dimensions={listGroupDimensions}
      />
    </>
  );
};

export default genericMemo(PortalContent);
