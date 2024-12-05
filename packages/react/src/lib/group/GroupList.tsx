import { PropsWithChildren, useContext, useRef } from 'react';

import { DefaultItemT } from '../types';
import { genericMemo, GroupListProps } from './types';
import context from './context';
import useMountList from './hooks/useMountList';

const MemoedGroupList = genericMemo(
  <ItemT extends DefaultItemT>(
    props: PropsWithChildren<GroupListProps<ItemT>>
  ) => {
    useMountList(props);
    return null;
  },
  (prev, cur) => {
    // @ts-ignore
    if (cur.changed) return true;

    const keys = Object.keys(prev);

    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      // @ts-ignore
      if (prev[key] !== cur[key]) {
        return false;
      }
    }
    return true;
  }
);

const GroupListWrapper = <ItemT extends DefaultItemT>(
  props: PropsWithChildren<GroupListProps<ItemT>>
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
