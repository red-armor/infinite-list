import { ScrollView } from 'react-native';
import ReactNativeDocument from '../Document';

export type IntersectionObserverProps = {
  root: ScrollView;
  document: ReactNativeDocument;
  rootMargin?: string;
  threshold?: number | number[];
};

/**
 * DOMRect
 */
export type ClientRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
