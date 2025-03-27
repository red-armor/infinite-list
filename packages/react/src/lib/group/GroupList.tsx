import type { PropsWithChildren} from 'react';
import { useContext, useRef } from 'react';

import type { DefaultItemT } from '../types';
import context from './context';
import useMountList from './hooks/useMountList';
import type { GroupListProps } from './types';
import { genericMemo } from './types';

const MemoedGroupList = genericMemo(
  <ItemT extends DefaultItemT>(
    props: PropsWithChildren<GroupListProps<ItemT>>
  ) => {
    useMountList(props);
    return null;
  },
  (prev, cur) => {
    if (cur.changed) return true;

    const keys = Object.keys(prev);

    for (const key of keys) {
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
