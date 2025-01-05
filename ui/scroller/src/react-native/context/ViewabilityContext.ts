import { createContext } from 'react';

import { DataModelDimensions } from '../types';

export default createContext<{
  dimensions: DataModelDimensions;
}>({
  dimensions: null,
});
