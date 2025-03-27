import type { GenericItemT, RecycleStateResult } from '@infinite-list/strategies';
import type { ItemMetaOwner } from '@infinite-list/types';
import type { PropsWithChildren} from 'react';
import { memo, useEffect, useMemo, useState } from 'react';

import type {
  ExtraInfo,
  GroupRecycleContentProps,
  GroupSpaceContentProps,
  PortalContextProps,
  TRecycleContentItem,
} from '../types';
import GroupListItemImpl from './GroupListItemImpl';

const RecycleContentItem = <ItemT extends GenericItemT = GenericItemT>(
  props: TRecycleContentItem<ItemT>
) => {
  const {
    listKey,
    itemMeta,
    dimensions,
    item,
    offset,
    recycleItemContainerKey,
    horizontal,
    ListItemWrapper,
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

  const metaOwner = useMemo<ItemMetaOwner<ItemT, ExtraInfo<ItemT>>>(() => {
    return itemMeta.getOwner();
  }, [itemMeta]);

  const info = metaOwner.extraInfo as ExtraInfo<ItemT>;

  return (
    <RecycleContentItemWrapper style={containerStyle}>
      <GroupListItemImpl
        item={item}
        itemKey={listKey}
        itemMeta={itemMeta}
        renderItem={info.renderItem}
        teleportItemProps={info.teleportItemProps}
        recycleItemContainerKey={recycleItemContainerKey}
        ListItemWrapper={ListItemWrapper}
        dimensions={dimensions}
      />
    </RecycleContentItemWrapper>
  );
};
/**
 * could not use memo, because itemMeta change may not trigger update..
 */
// const MemoedRecycleContentItem = memo(
//   RecycleContentItem
// ) as typeof RecycleContentItem;

const RecycleContent = <ItemT extends GenericItemT = GenericItemT>(
  props: GroupRecycleContentProps<ItemT>
) => {
  const { state, RecycleContentItemWrapper, ListItemWrapper, ...rest } = props;
  return (
    <>
      {state.map((stateResult) => {
        const { key, itemMeta, item, ...stateResultRest } = stateResult;
        const metaOwner = itemMeta!.getOwner();
        const info = metaOwner.extraInfo as ExtraInfo<ItemT>;
        return (
          <RecycleContentItem
            key={key}
            renderItem={info.renderItem}
            item={item!}
            recycleItemContainerKey={key}
            RecycleContentItemWrapper={RecycleContentItemWrapper}
            ListItemWrapper={ListItemWrapper}
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

const SpaceContent = <ItemT extends GenericItemT = GenericItemT>(
  props: GroupSpaceContentProps<ItemT>
) => {
  const {
    state,
    listKey,
    dimensions,
    SpaceRendererComponent,
    ListItemWrapper,
  } = props;

  return (
    <>
      {state.map((stateResult) => {
        const { isSpace, key, item, length, itemMeta } = stateResult;

        const metaOwner = itemMeta?.getOwner();
        const info = metaOwner?.extraInfo as ExtraInfo<ItemT>;

        return isSpace ? (
          <SpaceRendererComponent key={key} style={{ height: length }} />
        ) : (
          <GroupListItemImpl
            item={item!}
            key={key}
            itemKey={listKey}
            itemMeta={itemMeta!}
            renderItem={info.renderItem}
            teleportItemProps={info.teleportItemProps}
            dimensions={dimensions}
            ListItemWrapper={ListItemWrapper}
            recycleItemContainerKey={key}
          />
        );
      })}
    </>
  );
};
const MemoedSpaceContent = memo(SpaceContent) as typeof SpaceContent;

const PortalContent = <ItemT extends GenericItemT = GenericItemT>(
  props: PropsWithChildren<PortalContextProps<ItemT>>
) => {
  const {
    id,
    listGroupDimensions,
    RecycleContentItemWrapper,
    SpaceRendererComponent,
    ListItemWrapper,
  } = props;
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
        ListItemWrapper={ListItemWrapper}
        SpaceRendererComponent={SpaceRendererComponent}
      />

      <MemoedRecycleContent
        listKey={id}
        ownerId={id}
        state={store.recycleState}
        ListItemWrapper={ListItemWrapper}
        dimensions={listGroupDimensions}
        RecycleContentItemWrapper={RecycleContentItemWrapper}
      />
    </>
  );
};

export default memo(PortalContent) as typeof PortalContent;
