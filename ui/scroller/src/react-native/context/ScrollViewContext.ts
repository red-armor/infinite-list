import { createContext } from 'react';

import Marshal from '../Marshal';

export const defaultScrollViewContext = {
  marshal: null,
};

export default createContext<{
  marshal: null | Marshal;
}>(defaultScrollViewContext);
