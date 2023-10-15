import React, { useContext, useRef } from 'react';
import context from './context';
import useMountItem from './hooks/useMountItem';

const GroupListItem = (props) => {
  useMountItem(props);
  return null;
};

const MemoedGroupListItem = React.memo(GroupListItem, (prev, cur) => {
  if (cur.changed) return true;

  const keys = Object.keys(prev);

  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    if (prev[key] !== cur[key]) {
      return false;
    }
  }
  return true;
});

const GroupListItemWrapper = (props) => {
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
