import * as React from 'react';
import { useContext, useRef } from 'react';

import context from './context';
import useMountItem from './hooks/useMountItem';

// @ts-ignore
const GroupListItem = (props) => {
  useMountItem(props);
  return null;
};

const MemoedGroupListItem = React.memo(GroupListItem, (prev, cur) => {
  if (cur.changed) return true;

  const keys = Object.keys(prev);

  for (const key of keys) {
    if (prev[key] !== cur[key]) {
      return false;
    }
  }
  return true;
});

// @ts-ignore
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
