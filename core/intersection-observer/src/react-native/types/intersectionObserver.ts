import type { TouchableHighlight, TouchableOpacity, View } from 'react-native';

import type { IClientRectReadOnly } from '../../types';
import type IntersectionObserver from '../IntersectionObserver';
import type ReactNativeDocument from '../ReactNativeDocument';
import type { IIntersectionObserverEntry } from './intersectionObserverEntry';
import type { OnRectChange } from './observer';

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
  onRectChange?: OnRectChange;
};

export interface IIntersectionObserver {
  observe: (el: View, options: ObserveOptions) => void;
}

export type ObservedComponent = View | TouchableHighlight | TouchableOpacity;

// export function IntersectionObserverCallback(entries: IIntersectionObserverEntry[], observer: IntersectionObserver): void

// export interface IntersectionObserverCallback {
//   (
//     entries: IIntersectionObserverEntry[],  // 观察的元素
//     observer: IntersectionObserver,
//   ): void;
//   (
//     entries: IIntersectionObserverEntry[],  // 观察的元素
//   ): void;
// }

export type IntersectionObserverCallback = (
    entries: IIntersectionObserverEntry[],
    observer?: IntersectionObserver
  ) => void;
