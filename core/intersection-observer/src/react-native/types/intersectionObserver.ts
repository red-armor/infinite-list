import { ScrollView } from 'react-native';

export type IntersectionObserverProps = {
  root: ScrollView;
  rootMargin?: string;
  threshold?: number | number[];
};
