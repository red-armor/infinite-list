import { View } from 'react-native';
import {
  IClientRectReadOnly,
  IntersectionObserverEntryProps,
  IIntersectionObserverEntry,
  IRectIntersection,
} from './types';
import { generateRandomKey } from './generateRandom';

class IntersectionObserverEntry {
  private target: View;
  readonly entryKey: string;
  private time: number;
  readonly isIntersecting: boolean;
  readonly rootBounds: IClientRectReadOnly | null;
  readonly boundingClientRect: IClientRectReadOnly;
  readonly intersectionRect: IRectIntersection | null;

  constructor(props: IntersectionObserverEntryProps) {
    const {
      boundingClientRect,
      rootBounds,
      target,
      entryKey = generateRandomKey(),
      intersectionRect,
    } = props;
    this.time = Date.now();
    this.target = target;
    this.entryKey = entryKey;
    this.rootBounds = rootBounds;
    this.isIntersecting = !!intersectionRect;
    this.boundingClientRect = boundingClientRect;
    this.intersectionRect = intersectionRect;
  }

  getEntry(): IIntersectionObserverEntry {
    return {
      time: this.time,
      target: this.target,
      rootBounds: this.rootBounds,
      boundingClientRect: this.boundingClientRect,
      intersectionRect: this.intersectionRect,
      isIntersecting: this.isIntersecting,
      intersectionRatio: this.getIntersectionRation(),
    };
  }

  getIntersectionRation() {
    if (!this.intersectionRect) return 0;
    // Calculates the intersection ratio.
    const targetRect = this.boundingClientRect;
    const targetArea = targetRect.width * targetRect.height;
    const intersectionRect = this.intersectionRect;
    const intersectionArea = intersectionRect.width * intersectionRect.height;

    // Sets intersection ratio.
    if (targetArea) {
      // Round the intersection ratio to avoid floating point math issues:
      // https://github.com/w3c/IntersectionObserver/issues/324
      return Number((intersectionArea / targetArea).toFixed(4));
    }
    // If area is zero and is intersecting, sets to 1, otherwise to 0
    return this.isIntersecting ? 1 : 0;
  }
}

export default IntersectionObserverEntry;
