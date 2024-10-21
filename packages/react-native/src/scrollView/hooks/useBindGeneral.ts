import noop from '@x-oasis/noop';
import { useContext, useEffect, useMemo } from 'react';

import ViewabilityContext from '../context/ViewabilityContext';

export default (props: {
  ownerId?: string;
  onViewable?: () => void;
  onImpression?: () => void;
  viewableItemHelperKey: string;
  viewAbilityPropsSensitive?: boolean;
}) => {
  const { ownerId, onImpression, onViewable, viewableItemHelperKey } = props;
  const { dimensions } = useContext(ViewabilityContext);

  const meta = useMemo(
    () => dimensions.ensureKeyMeta(viewableItemHelperKey, ownerId),
    [viewableItemHelperKey, ownerId]
  );

  useEffect(() => {
    if (typeof onViewable === 'function')
      return meta?.addStateEventListener('viewable', onViewable);
    return noop;
  }, [meta, onViewable, viewableItemHelperKey]);

  useEffect(() => {
    if (typeof onImpression === 'function')
      return meta?.addStateEventListener('impression', onImpression);
    return noop;
  }, [meta, onImpression, viewableItemHelperKey]);
};
