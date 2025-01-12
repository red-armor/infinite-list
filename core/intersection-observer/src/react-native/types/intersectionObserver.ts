import { ScrollView } from 'react-native';

export type IntersectionObserverProps = {
  root: ScrollView;
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
