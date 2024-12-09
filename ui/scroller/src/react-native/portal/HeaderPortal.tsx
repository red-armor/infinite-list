import { useContext, useEffect, useMemo } from 'react';

import ScrollViewContext from '../context/ScrollViewContext';

let count = 1;

// @ts-ignore
const HeaderPortal = (props) => {
  const { portalManager } = useContext(ScrollViewContext);
  const componentKey = useMemo(() => `header_${count++}`, []);
  const { children } = props;

  useEffect(() => {
    // @ts-ignore
    portalManager.setHeaderInfo((info) => {
      const { group = [] } = info;
      // @ts-ignore
      const index = group.findIndex((c) => c.key === componentKey);
      const n = {
        key: componentKey,
        c: children,
      };
      const before = group.slice(0, index);
      const after = group.slice(index + 1);

      if (index !== -1)
        return {
          ...info,
          // @ts-ignore
          group: [].concat(before, n, after),
        };

      return {
        ...info,
        group: group.concat(n),
      };
    });
  }, [children]);

  return null;
};

export default HeaderPortal;
