import ListGroupDimensions from '../ListGroupDimensions';

export type IndexKeys = Array<string>;
export type OnIndexKeysChanged = { (props: { indexKeys: IndexKeys }): void };

export type InspectorProps = {
  owner: ListGroupDimensions;
  onChange: OnIndexKeysChanged;
};
