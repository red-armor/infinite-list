import { ScrollView } from 'react-native';

export type OwnerScrollView = ScrollView | null | undefined;

export type ContainerObserverProps = {
  ownerScrollView: OwnerScrollView;
  rootScrollView: ScrollView;
};
