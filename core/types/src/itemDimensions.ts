import { ItemMetaOwnerRequiredProps } from './itemMeta';

export interface IItemDimensions<ExtraInfo extends {} = {}>
  extends ItemMetaOwnerRequiredProps {
  extraInfo: ExtraInfo;
}
