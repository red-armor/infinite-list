import { useEffect, useMemo, memo, useState, PropsWithChildren } from 'react';
import { GenericItemT, RecycleStateResult } from '@infinite-list/strategies';
import { ItemMetaOwner } from '@infinite-list/types';
import {
  PortalContextProps,
  GroupRecycleContentProps,
  GroupSpaceContentProps,
  RecycleContentItem,
  ExtraInfo,
} from '../types';

import GroupListItemImpl from './GroupListItemImpl';

const RecycleContentItem = <IStyle, ItemT extends GenericItemT = GenericItemT>(
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
        containerKey={containerKey}
        dimensions={dimensions}
      />
    </RecycleContentItemWrapper>
  );
};
const MemoedRecycleContentItem = memo(
  RecycleContentItem
) as typeof RecycleContentItem;

const RecycleContent = <IStyle, ItemT extends GenericItemT = GenericItemT>(
  props: GroupRecycleContentProps<IStyle, ItemT>
) => {
  const { state, RecycleContentItemWrapper, ...rest } = props;
  return (
    <>
      {state.map((stateResult) => {
        const { key, itemMeta, item, ...stateResultRest } = stateResult;
        const metaOwner = itemMeta!.getOwner();
        const info = metaOwner.extraInfo as ExtraInfo<ItemT>;
        return (
          <MemoedRecycleContentItem
            key={key}
            containerKey={key}
            renderItem={info.renderItem}
            item={item!}
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

const SpaceContent = <IStyle, ItemT extends GenericItemT = GenericItemT>(
  props: GroupSpaceContentProps<IStyle, ItemT>
) => {
  const { state, listKey, dimensions, SpaceRendererComponent } = props;

  return (
    <>
      {state.map((stateResult, index) => {
        const { isSpace, key, item, length, isSticky, itemMeta } = stateResult;

        const metaOwner = itemMeta!.getOwner();
        const info = metaOwner.extraInfo as ExtraInfo<ItemT>;

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
          />
        );
      })}
    </>
  );
};
const MemoedSpaceContent = memo(SpaceContent) as typeof SpaceContent;

const PortalContent = <IStyle, ItemT extends GenericItemT = GenericItemT>(
  props: PropsWithChildren<PortalContextProps<IStyle, ItemT>>
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

export default memo(PortalContent) as typeof PortalContent;
