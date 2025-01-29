import ContainerObserver from '../ContainerObserver';
import ReactNativeDocument from '../ReactNativeDocument';

export type OwnerContainerObserver = ContainerObserver | null | undefined;

export type ContainerObserverProps = {
  doc: ReactNativeDocument;
  ownerContainerObserver: OwnerContainerObserver;
};
