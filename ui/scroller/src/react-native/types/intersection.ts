export type ObserverComponentProps = {
  observerKey: string;
  children: (props: { ref: (ref: any) => void }) => React.ReactNode;
};
