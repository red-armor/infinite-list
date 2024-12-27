import { ItemMetaOwnerRequiredProps } from './itemMeta';
export interface IItemDimensions extends ItemMetaOwnerRequiredProps {
  resolveConfigTuplesDefaultState(defaultValue?: boolean): {
    [key: string]: boolean;
  };
}
