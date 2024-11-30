// import GroupIntervalTreeViewabilityGeneral from '../viewable/GroupIntervalTreeViewabilityGeneral';
// import IntervalTreeViewabilityGeneral from '../viewable/IntervalTreeViewabilityGeneral';
// import ItemViewabilityGeneral from '../viewable/ItemViewabilityGeneral';

// export type ViewabilityGeneral<T extends any = any> =
//   | ItemViewabilityGeneral
//   | IntervalTreeViewabilityGeneral<T>
//   | GroupIntervalTreeViewabilityGeneral;

// export type GetContainerOffset = () => { length: number };
export type GetContainerLayout = () => {
  x: number;
  y: number;
  height: number;
  width: number;
};

export type TriggerMeasurementType = 'onLayout' | 'onMount';

export type ViewableState = {
  [key: string]: boolean;
};
