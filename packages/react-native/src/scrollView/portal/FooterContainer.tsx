import React, { useContext, useRef, useState } from 'react';

import ScrollViewContext from '../context/ScrollViewContext';

const FooterContainer = () => {
  const { portalManager } = useContext(ScrollViewContext);
  const initialRef = useRef(true);
  const [info, setInfo] = useState({
    group: [],
  });

  if (initialRef.current) {
    initialRef.current = false;
    portalManager.registerFooterInfoSetter(setInfo);
  }

  return <>{info.group.map((i) => i.c)}</>;
};

export default FooterContainer;
