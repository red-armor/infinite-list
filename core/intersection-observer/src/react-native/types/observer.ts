import type { ScrollView, View } from 'react-native';

import type { IClientRectReadOnly } from '../../types';
import type ContainerObserver from '../ContainerObserver';
import type ReactNativeDocument from '../ReactNativeDocument';

export type OnRectChange = (rect: IClientRectReadOnly) => void;

export type ObserverProps = {
  root: ObserverRoot;
  target: View;
  observerKey?: string;
  onRectChange?: OnRectChange;
  containerObserver: ContainerObserver;
};

export type ObserverRoot = ScrollView | ReactNativeDocument;
