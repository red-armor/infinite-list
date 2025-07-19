import { ItemMetaOwnerRequiredProps } from './itemMeta';

export interface IItemDimensions<
  ExtraInfo extends object = Record<string, never>,
> extends ItemMetaOwnerRequiredProps {
  extraInfo: ExtraInfo;
}
