import { TouchableHighlight, TouchableOpacity, View } from 'react-native';
import ReactNativeDocument from '../ReactNativeDocument';
import { IClientRectReadOnly } from '../../types';

export type IntersectionObserverProps = {
  root: ReactNativeDocument;
  document?: ReactNativeDocument;
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

/**
 * @param root original from https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/IntersectionObserver#options
 * In react native condition,
 */
export type ObserveOptions = {
  observerKey: string;
  root: ReactNativeDocument;
};

export interface IIntersectionObserver {
  observe: (el: View, options: ObserveOptions) => void;
}

export type ObservedComponent = View | TouchableHighlight | TouchableOpacity;
