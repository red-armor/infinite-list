import { Dimensions, Platform } from 'react-native';

import {
  usePagerView,
  useViewPagerAndroid,
} from '../component/PagerViewAdapter';

const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');
const usePager = useViewPagerAndroid || usePagerView;

export {
  deviceHeight,
  deviceWidth,
  useViewPagerAndroid,
  usePagerView,
  usePager,
};

export const isIos = Platform.OS === 'ios';

export const useNativeRefreshControl = !isIos;
