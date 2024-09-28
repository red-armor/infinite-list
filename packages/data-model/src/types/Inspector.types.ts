import ListGroupDimensions from '../ListGroupDimensions';

export type IndexKeys = Array<string>;
export type OnIndexKeysChanged = { (props?: { indexKeys: IndexKeys }): void };

export type InspectorProps<
  ItemT extends {
    [key: string]: any;
  } = object
> = {
  owner: ListGroupDimensions<ItemT>;
  onChange: OnIndexKeysChanged;
};

export type AnchorLocation = {
  startIndex: number;
  endIndex: number;
};

export type AnchorRange = {
  [key: string]: AnchorLocation;
};

export type InspectingAPI = {
  inspectingTimes: number;
  inspectingTime: number;
  heartBeat: (props: { listKey: string; inspectingTime: number }) => void;
  startInspection: () => void;
};

export type InspectingListener = (props: InspectingAPI) => void;
