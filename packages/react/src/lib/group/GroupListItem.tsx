import React, { useContext, useRef } from 'react';
import { GenericItemT } from '@infinite-list/data-model';
import context from './context';
import useMountItem from './hooks/useMountItem';
import { genericMemo, GroupListItemImplProps } from './types';

const MemoedGroupListItem = genericMemo(
  <ItemT extends GenericItemT>(props: GroupListItemImplProps<ItemT>) => {
    useMountItem(props);
    return null;
  },
  (prev, cur) => {
    if (cur.changed) return true;

    const keys = Object.keys(prev);

    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      if (prev[key] !== cur[key]) {
        return false;
      }
    }
    return true;
  }
);

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
