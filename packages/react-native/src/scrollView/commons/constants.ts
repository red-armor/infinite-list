import { Dimensions } from 'react-native';

const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');

export const DEFAULT_SCROLL_EVENT_THROTTLE = 16;

export const DEFAULT_LAYOUT_MEASUREMENT = {
  width: deviceWidth,
  height: deviceHeight,
};

export const DEFAULT_SCROLL_HELPER_LAYOUT = {
  x: 0,
  y: 0,
  width: deviceWidth,
  height: deviceHeight,
};

export const DEFAULT_SCROLL_EVENT_METRICS = {
  contentInset: {
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  },
  contentOffset: {
    x: 0,
    y: 0,
  },
  contentSize: {
    width: deviceWidth,
    height: deviceHeight,
  },
  layoutMeasurement: DEFAULT_LAYOUT_MEASUREMENT,
  zoomScale: 1,
};

export const DEFAULT_LIST_KEY_PREFIX = '__spectrum_list__';
export const DEFAULT_ITEM_KEY_PREFIX = '__spectrum_item__';
