import { createContext } from 'react';

import type { DataModelDimensions } from '../types';

// import { ViewabilityGeneral } from '../types';

export default createContext<{
  // viewabilityGeneral: ViewabilityGeneral;
  dimensions: DataModelDimensions;
}>({
  // @ts-ignore
  dimensions: null,
});
