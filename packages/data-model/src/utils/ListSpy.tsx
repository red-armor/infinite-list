// import React, { useCallback, useMemo, useState } from 'react';
// import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

// import ListSpyUtils from './ListSpyUtils';

// const styles = StyleSheet.create({
//   touchView: {
//     backgroundColor: '#42647f',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRadius: 50,
//     width: 50,
//     height: 50,
//   },
//   touchText: {
//     fontSize: 10,
//     color: '#d5b77a',
//   },
// });

// const ListSpy = () => {
//   const [enableDispatchOnScroll, setEnableDispatchOnScroll] = useState(
//     ListSpyUtils.getEnableDispatchOnScroll()
//   );

//   const onPress = useCallback(() => {
//     ListSpyUtils.setEnableDispatchOnScorll(!enableDispatchOnScroll);
//     setEnableDispatchOnScroll(!enableDispatchOnScroll);
//   }, [enableDispatchOnScroll]);

//   const containerStyle = useMemo<ViewStyle[]>(() => {
//     return [
//       styles.touchView,
//       {
//         opacity: enableDispatchOnScroll ? 0.5 : 1,
//       },
//     ];
//   }, [enableDispatchOnScroll]);

//   return (
//     <TouchableOpacity
//       style={containerStyle}
//       onPress={onPress}
//       activeOpacity={1}
//     >
//       <Text style={styles.touchText}>ListSpy</Text>
//     </TouchableOpacity>
//   );
// };

// export default ListSpy;

export default () => null;
