import { View } from 'react-native';
import createObserverComponent from './createInterObserverComponent';

const IntersectionObserverView = createObserverComponent(View);
export default IntersectionObserverView;
