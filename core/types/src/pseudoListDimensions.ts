import { ItemMetaOwnerRequiredProps } from './itemMeta';

export interface IPseudoListDimensions<
  ExtraInfo extends object = Record<string, never>,
> extends ItemMetaOwnerRequiredProps {
  id: string;
  extraInfo: ExtraInfo;
}
