export type ContainerLayoutGetter = () => {
  x: number;
  y: number;
  height: number;
  width: number;
};

export type BaseContainerProps = {
  id: string;
  horizontal?: boolean;
  getContainerLayout?: ContainerLayoutGetter;

  canIUseRIC?: boolean;
};
