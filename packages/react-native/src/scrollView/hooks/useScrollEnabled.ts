import { useEffect, useState } from 'react';

import type ScrollHelper from '../ScrollHelper';

export default (props: {
  scrollEnabled: boolean;
  scrollHelper: ScrollHelper;
}) => {
  const { scrollEnabled: _scrollEnabled, scrollHelper } = props;
  const [scrollEnabled, setScrollEnabled] = useState(_scrollEnabled);
  useEffect(() => {
    scrollHelper.addScrollEnabledHandler(setScrollEnabled);
  }, []);

  return [scrollEnabled];
};
