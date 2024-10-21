import { createContext } from 'react';

import { DataModelDimensions } from '../types';

// import { ViewabilityGeneral } from '../types';

export default createContext<{
  // viewabilityGeneral: ViewabilityGeneral;
  dimensions: DataModelDimensions;
}>({
  dimensions: null,
});
