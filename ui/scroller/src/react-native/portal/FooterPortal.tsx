import { FC, PropsWithChildren, useContext, useEffect, useMemo } from 'react';
import ScrollViewContext from '../context/ScrollViewContext';

let count = 1;
const FooterPortal: FC<PropsWithChildren> = (props) => {
  const { portalManager } = useContext(ScrollViewContext);
  const { children } = props;
  const componentKey = useMemo(() => `footer_${count++}`, []);

  useEffect(() => {
    portalManager?.setFooterInfo((info: any) => {
      const { group = [] } = info;
      const index = group.findIndex((c: any) => c.key === componentKey);
      const n = {
        key: componentKey,
        c: children,
      };

      const before = group.slice(0, index);
      const after = group.slice(index + 1);

      if (index !== -1)
        return {
          ...info,
          group: [].concat(before, n as any, after),
        };

      return {
        ...info,
        group: group.concat(n),
      };
    });
  }, [children]);

  return null;
};

export default FooterPortal;
