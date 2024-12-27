import React, {
  useEffect,
  useMemo,
  memo,
  useState,
  PropsWithChildren,
} from 'react';
import { GenericItemT, RecycleStateResult } from '@infinite-list/strategies';
import {
  genericMemo,
  PortalContextProps,
  GroupRecycleContentProps,
  GroupSpaceContentProps,
  RecycleContentItem,
} from '../types';

import GroupListItemImpl from './GroupListItemImpl';

const RecycleContentItem = <IStyle, ItemT extends GenericItemT>(
  props: RecycleContentItem<IStyle, ItemT>
) => {
  const {
    listKey,
    itemMeta,
    dimensions,
    item,
    offset,
    containerKey,
    horizontal,
    RecycleContentItemWrapper,
  } = props;

  const containerStyle = useMemo(
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
    <RecycleContentItemWrapper style={containerStyle}>
      <GroupListItemImpl
        item={item}
        itemKey={listKey}
        itemMeta={itemMeta}
        renderItem={itemMeta.getOwner().renderItem}
        teleportItemProps={itemMeta.getOwner().teleportItemProps}
        containerKey={containerKey}
        dimensions={dimensions}
      />
    </RecycleContentItemWrapper>
  );
};
const MemoedRecycleContentItem = memo(
  RecycleContentItem
) as typeof RecycleContentItem;

const RecycleContent = <IStyle, ItemT extends GenericItemT>(
  props: GroupRecycleContentProps<IStyle, ItemT>
) => {
  const { state, RecycleContentItemWrapper, ...rest } = props;
  return (
    <>
      {state.map((stateResult) => {
        const { key, itemMeta, ...stateResultRest } = stateResult;
        return (
          <MemoedRecycleContentItem<IStyle, ItemT>
            key={key}
            containerKey={key}
            renderItem={itemMeta!.getOwner().renderItem}
            RecycleContentItemWrapper={RecycleContentItemWrapper}
            itemMeta={itemMeta!}
            {...rest}
            {...stateResultRest}
          />
        );
      })}
    </>
  );
};
const MemoedRecycleContent = memo(RecycleContent) as typeof RecycleContent;

const SpaceContent = <IStyle, ItemT extends GenericItemT>(
  props: GroupSpaceContentProps<IStyle, ItemT>
) => {
  const { state, listKey, dimensions, SpaceRendererComponent } = props;

  return (
    <>
      {state.map((stateResult, index) => {
        const { isSpace, key, item, length, isSticky, itemMeta } = stateResult;
        return isSpace ? (
          <SpaceRendererComponent key={key} style={{ height: length }} />
        ) : (
          <GroupListItemImpl<ItemT>
            item={item!}
            key={key}
            itemKey={listKey}
            itemMeta={itemMeta!}
            renderItem={itemMeta!.getOwner().renderItem}
            teleportItemProps={itemMeta!.getOwner().teleportItemProps}
            dimensions={dimensions}
          />
        );
      })}
    </>
  );
};
const MemoedSpaceContent = memo(SpaceContent) as typeof SpaceContent;

const PortalContent = <IStyle, ItemT extends GenericItemT>(
  props: PropsWithChildren<PortalContextProps<IStyle, ItemT>>
) => {
  const {
    id,
    listGroupDimensions,
    RecycleContentItemWrapper,
    SpaceRendererComponent,
  } = props;
  const [store, setStore] = useState(
    () =>
      listGroupDimensions.getStateResult() as any as RecycleStateResult<ItemT>
  );

  useEffect(
    () =>
      listGroupDimensions.addStateListener((newState) => {
        setTimeout(() =>
          setStore(newState as any as RecycleStateResult<ItemT>)
        );
      }),
    []
  );

  return (
    <>
      <MemoedSpaceContent<IStyle, ItemT>
        listKey={id}
        ownerId={id}
        state={store.spaceState}
        dimensions={listGroupDimensions}
        SpaceRendererComponent={SpaceRendererComponent}
      />

      <MemoedRecycleContent
        listKey={id}
        ownerId={id}
        state={store.recycleState}
        dimensions={listGroupDimensions}
        RecycleContentItemWrapper={RecycleContentItemWrapper}
      />
    </>
  );
};

export default genericMemo(PortalContent);
