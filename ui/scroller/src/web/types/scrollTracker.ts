export interface RefObjectLink<T> {
  current: T | null;
}

export type TDomNode = HTMLDivElement | RefObjectLink<HTMLDivElement>;
export type ScrollTrackerProps = {
  horizontal?: boolean;
  domNode: TDomNode;
  velocityTrackerTimeout?: number;
  onScroll?: (e: Event) => void;
  onScrollEnd?: (e: Event) => void;
};
