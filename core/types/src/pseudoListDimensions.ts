import { ItemMetaOwnerRequiredProps } from './itemMeta';

export interface IPseudoListDimensions<ExtraInfo extends {} = {}>
  extends ItemMetaOwnerRequiredProps {
  id: string;
  extraInfo: ExtraInfo;
}
