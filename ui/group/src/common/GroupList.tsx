import { memo, PropsWithChildren, useContext, useRef } from 'react';

import { DefaultItemT } from '../types';
import { GroupListProps } from '../types';
import context from './context';
import useMountList from './hooks/useMountList';

const GroupList = <ItemT extends DefaultItemT>(
  props: PropsWithChildren<GroupListProps<ItemT>>
) => {
  useMountList(props);
  return null;
};

const MemoedGroupList = memo(GroupList) as typeof GroupList;

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
