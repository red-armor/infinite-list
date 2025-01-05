import { ItemMeta } from '@infinite-list/item-meta';
import { createContext } from 'react';

export default createContext<{
  itemMeta: ItemMeta;
}>({
  itemMeta: null,
});
