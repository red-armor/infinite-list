import type ContainerObserver from '../ContainerObserver';
import type ReactNativeDocument from '../ReactNativeDocument';

export type OwnerContainerObserver = ContainerObserver | null | undefined;

export type ContainerObserverProps = {
  doc: ReactNativeDocument;
  ownerContainerObserver: OwnerContainerObserver;
};
