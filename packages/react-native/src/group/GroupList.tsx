import React, { PropsWithChildren, useContext, useRef, FC } from 'react';

import { DefaultItemT, GroupListProps } from '../../List/types';
import context from './context';
import useMountList from './hooks/useMountList';

const GroupList = <ItemT extends DefaultItemT>(
  props: PropsWithChildren<GroupListProps<ItemT>>
) => {
  useMountList(props);
  return null;
};

const MemoedGroupList = React.memo<PropsWithChildren<GroupListProps<any>>>(
  GroupList,
  (prev, cur) => {
    // @ts-ignore
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

const GroupListWrapper: FC<PropsWithChildren<GroupListProps<any>>> = (
  props
) => {
  const contextValues = useContext(context);
  const contextValuesRef = useRef(contextValues);

  if (
    contextValuesRef.current.inspectingTimes !== contextValues.inspectingTimes
  ) {
    contextValuesRef.current.heartBeat({
      inspectingTime: contextValues.inspectingTime,
      listKey: props.id,
    });
    contextValuesRef.current = contextValues;
  }
  return <MemoedGroupList {...props} />;
};

export default GroupListWrapper;
