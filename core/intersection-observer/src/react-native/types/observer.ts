import { ScrollView, View } from 'react-native';
import { IClientRectReadOnly } from '../../types';
import ContainerObserver from '../ContainerObserver';
import ReactNativeDocument from '../ReactNativeDocument';

export type OnRectChange = (rect: IClientRectReadOnly) => void;

export type ObserverProps = {
  root: ObserverRoot;
  target: View;
  observerKey?: string;
  onRectChange?: OnRectChange;
  containerObserver: ContainerObserver;
};

export type ObserverRoot = ScrollView | ReactNativeDocument;
