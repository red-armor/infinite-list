import type { ComponentProps, ComponentType } from 'react';
import * as React from 'react';

export * from './GroupList.types';
export * from './GroupListItemImpl.types';
export * from './ListGroup.types';
export * from './ListItem.types';
export * from './PortalContext.types';

export const genericMemo: <T extends ComponentType<any>>(
  component: T,
  propsAreEqual?: (
    prevProps: Readonly<ComponentProps<T>>,
    nextProps: Readonly<ComponentProps<T>>
  ) => boolean
) => T = React.memo;
