import {
  NativeMethods,
  HostComponent,
  MeasureLayoutOnSuccessCallback,
} from 'react-native';

// https://github.com/facebook/react-native/blob/main/packages/react-native/Libraries/ReactNative/UIManager.d.ts#L17
// https://github.com/facebook/react-native/blob/main/packages/react-native/types/public/ReactNativeTypes.d.ts#L45
export type MeasureOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number
) => void;

export type MeasureInWindowOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number
) => void;

export type OnFail = () => void;

export type NodeHandle = number;

export type findNodeHandle = (
  componentOrHandle:
    | null
    | number
    | React.Component<any, any>
    | React.ComponentClass<any>
) => null | NodeHandle;

/**
 *
 * @param node: number
 * @param relativeToNativeComponentRef
 * @param onSuccess
 * @param onFail
 */
export const measureLayout = (
  node: React.ElementRef<HostComponent<any>> | number,
  relativeToNativeComponentRef: React.ElementRef<HostComponent<any>> | number,
  onSuccess: MeasureLayoutOnSuccessCallback,
  onFail?: OnFail
) => {
  console.log('node ----', node, relativeToNativeComponentRef);
  if (node) {
    (node as any as NativeMethods).measureLayout(
      relativeToNativeComponentRef.current,
      onSuccess,
      onFail
    );
  }
};
