import { ScrollView, View } from 'react-native';
import ReactNativeDocument from '../ReactNativeDocument';
import ContainerObserver from '../ContainerObserver';
import { IClientRectReadOnly } from '../../types';

export type OnRectChange = (rect: IClientRectReadOnly) => void;

export type ObserverProps = {
  root: ObserverRoot;
  target: View;
  observerKey?: string;
  onRectChange?: OnRectChange;
  containerObserver: ContainerObserver;
};

export type ObserverRoot = ScrollView | ReactNativeDocument;
