import { memo, useContext, useRef } from 'react';
import type { GenericItemT } from '@infinite-list/types';
import type { GroupDimensionItemProps } from '../types';
import context from './context';
import useMountItem from './hooks/useMountDimensionItem';

const GroupDimensionItem = <ItemT extends GenericItemT>(
  props: GroupDimensionItemProps<ItemT>
) => {
  useMountItem<ItemT>(props);
  return null;
};

const MemoedGroupDimensionItem = memo(
  GroupDimensionItem
) as typeof GroupDimensionItem;

const GroupDimensionItemWrapper = <ItemT extends GenericItemT>(
  props: GroupDimensionItemProps<ItemT>
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

  return <MemoedGroupDimensionItem {...props} />;
};

export default GroupDimensionItemWrapper;
