import { ScrollView } from 'react-native';
import ReactNativeDocument from '../Document';
import { IClientRectReadOnly } from '../../types';

export type IntersectionObserverProps = {
  root: ScrollView;
  document: ReactNativeDocument;
  rootMargin?: string;
  threshold?: number | number[];
};

export interface ItemLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * DOMRect
 */
export interface ClientRect extends IClientRectReadOnly {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ClientRectVerbose = {};

export type MonitorDisposer = () => void;
