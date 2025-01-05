import { ItemMeta } from '@infinite-list/data-model';
import { createContext } from 'react';

export default createContext<{
  itemMeta: ItemMeta;
}>({
  itemMeta: null,
});
