import { ScrollView } from 'react-native';
import ContainerObserver from '../ContainerObserver';

export type OwnerContainerObserver = ContainerObserver | null | undefined;

export type ContainerObserverProps = {
  ownerContainerObserver: OwnerContainerObserver;
  rootScrollView: ScrollView;
};
