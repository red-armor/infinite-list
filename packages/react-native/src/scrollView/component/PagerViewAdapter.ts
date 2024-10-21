import * as RN from 'react-native';
import { Platform } from 'react-native';
import _PagerView from 'react-native-pager-view';

export const isIos = Platform.OS === 'ios';

const _usePager = !isIos;
// Already deprecate
let useViewPagerAndroid = false;
let usePagerView = false;

export const usePager = usePagerView || useViewPagerAndroid;
let PagerView = null;

const usePagerViewer = RN.UIManager.getViewManagerConfig('RNCViewPager');

if (!isIos) {
  if (usePagerViewer) {
    PagerView = _PagerView;
    usePagerView = _usePager;
  } else {
    PagerView = RN.ViewPagerAndroid;
    useViewPagerAndroid = _usePager;
  }
}

export { useViewPagerAndroid, usePagerView, PagerView };
