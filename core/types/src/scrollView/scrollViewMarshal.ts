import type { IScrollHelper } from './scrollHelper';

export interface IScrollViewMarshal {
  ownerScrollHelper: IScrollHelper | null | undefined;

  scrollHelper: IScrollHelper;
}
