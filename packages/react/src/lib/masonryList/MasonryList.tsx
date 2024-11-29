import { useCallback, useState, useRef, useMemo } from 'react';
import {
  GenericItemT,
  MasonryDimension,
  MasonryStateResults,
} from '@infinite-list/data-model';
import { MasonryListProps } from './types';
import ColumnStateRenderer from './ColumnStateRender';

const MasonryList = <ItemT extends GenericItemT>(
  props: MasonryListProps<ItemT>
) => {
  const [state, setState] = useState<MasonryStateResults<ItemT>>();
  const { data, column, ...rest } = props;

  const stateListener = useCallback(
    (stateResult: MasonryStateResults<ItemT>) => {
      setState(stateResult);
    },
    []
  );

  const dimensionsModel = useMemo(
    () =>
      new MasonryDimension({
        data,
        column,
        ...rest,
        stateListener,
      }),
    []
  );

  const dataRef = useRef(data);

  if (dataRef.current !== data) {
    dimensionsModel.setData(data);
    dataRef.current = data;
  }

  return (
    <div className="masonry-list-container">
      {state?.map((columnState, index) => (
        <ColumnStateRenderer
          {...rest}
          key={index}
          state={columnState}
          columnIndex={index}
          dimensions={dimensionsModel}
        />
      ))}
    </div>
  );
};

export default MasonryList;
