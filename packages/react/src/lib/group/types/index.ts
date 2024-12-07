import React, { ComponentProps, ComponentType } from 'react';

export * from './ListItem.types';
export * from './GroupListItemImpl.types';
export * from './PortalContext.types';
export * from './ListGroup.types';
export * from './GroupList.types';

export const genericMemo: <T extends ComponentType<any>>(
  component: T,
  propsAreEqual?: (
    prevProps: Readonly<ComponentProps<T>>,
    nextProps: Readonly<ComponentProps<T>>
  ) => boolean
) => T = React.memo;
