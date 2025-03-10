import { TouchableOpacity } from 'react-native';
import createObserverComponent from './createInterObserverComponent';

const IntersectionObserverTouchableOpacity =
  createObserverComponent(TouchableOpacity);
export default IntersectionObserverTouchableOpacity;
