import React, {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useMemo,
} from 'react';
import { defaultKeyExtractor } from '@infinite-list/data-model';
import List from '../list/List';
import createStyles from './styles';
import { MasonryListProps } from './types'
import { shuffleData, defaultViewabilityConfigCallbackPairs } from './utils'

const styles = createStyles();

function defaultGetItemSeparatorLength() {
  return { length: 0 };
}

const MasonryList: ForwardRefRenderFunction<HTMLDivElement, MasonryListProps<any>> = (
  props,
  ref
) => {
  const {
    id,
    contentContainerStyle,
    listContentContainerStyle = styles.list,
    loadingContainerStyle,
    loadingStyle,
    loading = false,
    data,
    keyExtractor = defaultKeyExtractor,
    getItemLayout,
    getTeleportItemProps,
    teleportItemProps,
    getItemSeparatorLength = defaultGetItemSeparatorLength,
    renderItem: RenderItem,
    onEndReached,
    shouldSubListUseStaticLayout = true,
    viewabilityConfigCallbackPairs = defaultViewabilityConfigCallbackPairs,
    ...rest
  } = props;

  const masonryListContainerStyle = useMemo(() => {
    return [styles.container, contentContainerStyle];
  }, [contentContainerStyle]);

  const listContainerStyle = useMemo(() => {
    return listContentContainerStyle || styles.list;
  }, [listContentContainerStyle]);

  const { dataLeft, dataRight } = useMemo(() => {
    return shuffleData(data, getItemLayout);
  }, [data, getItemLayout]);

  const layoutProps = useMemo(
    () =>
      shouldSubListUseStaticLayout
        ? {
            getItemLayout,
            getItemSeparatorLength,
          }
        : {},
    []
  );

  return (
    <>
      <div style={masonryListContainerStyle} ref={ref}>
        {React.createElement(List, {
          ...rest,
          id: `${id}_left`,
          onEndReached,
          data: dataLeft,
          keyExtractor,
          ...layoutProps,
          teleportItemProps,
          renderItem: RenderItem,
          viewabilityConfigCallbackPairs,
          contentContainerStyle: listContainerStyle,
        })}
        {React.createElement(List, {
          ...rest,
          id: `${id}_right`,
          data: dataRight,
          keyExtractor,
          ...layoutProps,
          teleportItemProps,
          renderItem: RenderItem,
          viewabilityConfigCallbackPairs,
          contentContainerStyle: listContainerStyle,
        })}
      </div>
    </>
  );
};

/**
 * 瀑布流列表
 * @see https://fe-docs.devops.xiaohongshu.com/reds-spectrum/components/MasonryList
 * @param props `MasonryListProps`
 * @returns `React.ForwardRefRenderFunction<View, MasonryListProps>`
 */
export default memo(forwardRef(MasonryList));
