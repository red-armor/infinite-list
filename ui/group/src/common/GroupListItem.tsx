import { useContext, useRef, memo } from 'react';
import { GenericItemT } from '@infinite-list/types';
import context from './context';
import useMountItem from './hooks/useMountItem';
import { GroupListItemImplProps } from '../types';

const GroupListItem = <ItemT extends GenericItemT>(
  props: GroupListItemImplProps<ItemT>
) => {
  useMountItem<ItemT>(props);
  return null;
};

const MemoedGroupListItem = memo(GroupListItem) as typeof GroupListItem;

const GroupListItemWrapper = <ItemT extends GenericItemT>(
  props: GroupListItemImplProps<ItemT>
) => {
  const contextValues = useContext(context);
  const contextValuesRef = useRef(contextValues);

  // let changed = false;

  // console.log('heart beating ', contextValuesRef.current.inspectingTimes !== contextValues.inspectingTimes, props.itemKey)

  if (
    contextValuesRef.current.inspectingTimes !== contextValues.inspectingTimes
  ) {
    contextValuesRef.current.heartBeat({
      inspectingTime: contextValues.inspectingTime,
      listKey: props.itemKey,
    });
    contextValuesRef.current = contextValues;
    // changed = true;
  }

  return <MemoedGroupListItem {...props} />;
};

export default GroupListItemWrapper;
