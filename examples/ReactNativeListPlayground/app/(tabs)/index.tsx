// import { Image, StyleSheet, Platform } from 'react-native';

// import { HelloWave } from '@/components/HelloWave';
// import ParallaxScrollView from '@/components/ParallaxScrollView';
// import { ThemedText } from '@/components/ThemedText';
// import { ThemedView } from '@/components/ThemedView';

// import { List } from '@infinite-list/react-native';

// import logo from '@/assets/images/partial-react-logo.png';

// import React from 'react';

// window.React1 = React;

// console.log(
//   'vi ',
//   window.React1,
//   window.React2,
//   window.React1 == window.React2
// );

// export default function HomeScreen() {
//   return (
//     <ParallaxScrollView
//       headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
//       headerImage={<Image source={logo} style={styles.reactLogo} />}
//     >
//       <ThemedView style={styles.titleContainer}>
//         <ThemedText type="title">Welcome!</ThemedText>
//         <HelloWave />
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 1: Try it</ThemedText>
//         <ThemedText>
//           Edit{' '}
//           <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{' '}
//           to see changes. Press{' '}
//           <ThemedText type="defaultSemiBold">
//             {Platform.select({ ios: 'cmd + d', android: 'cmd + m' })}
//           </ThemedText>{' '}
//           to open developer tools.
//         </ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 2: Explore</ThemedText>
//         <ThemedText>
//           Tap the Explore tab to learn more about what's included in this
//           starter app.
//         </ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
//         <ThemedText>
//           When you're ready, run{' '}
//           <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText>{' '}
//           to get a fresh <ThemedText type="defaultSemiBold">app</ThemedText>{' '}
//           directory. This will move the current{' '}
//           <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
//           <ThemedText type="defaultSemiBold">app-example</ThemedText>.
//           <List />
//         </ThemedText>
//       </ThemedView>
//     </ParallaxScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   titleContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   stepContainer: {
//     gap: 8,
//     marginBottom: 8,
//   },
//   reactLogo: {
//     height: 178,
//     width: 290,
//     bottom: 0,
//     left: 0,
//     position: 'absolute',
//   },
// });

import { useCallback, useMemo, useRef } from 'react';
import { List } from '@infinite-list/react-native';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
} from 'react-native';

const buildData = (count: number, startIndex = 0) =>
  new Array(count).fill(1).map((v, index) => ({
    key: index + startIndex,
    value: index + startIndex,
  }));

export default () => {
  const data = useMemo(() => buildData(10000), []);
  const scrollViewRef = useRef<ScrollView>();

  const renderItem = useCallback((props: { item }) => {
    const { item } = props;
    return (
      <View style={{ height: 80, width: '100%', backgroundColor: '#fff' }}>
        <Text>{item.value}</Text>
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item) => {
    return item.key;
  }, []);

  const subscriptions = useMemo<{
    [key: string]: Function[];
  }>(() => {
    return {};
  }, []);

  const events = useMemo(() => {
    return {
      addEventListener: (eventName: string, fn: Function) => {
        if (!subscriptions[eventName]) subscriptions[eventName] = [];
        subscriptions[eventName] = ([] as Function[]).concat(
          subscriptions[eventName],
          fn
        );
      },
    };
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const cbs = subscriptions['onScroll'];
      if (cbs?.length) {
        cbs.forEach((cb) => cb(event));
      }
    },
    []
  );

  return (
    <ScrollView
      ref={scrollViewRef}
      onScroll={onScroll}
      contentContainerStyle={{
        backgroundColor: '#fff',
      }}
    >
      <List
        data={data}
        events={events}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        id="basic"
        initialNumToRender={4}
        containerRef={scrollViewRef}
        // recyclerBufferSize={40}
        // recyclerReservedBufferPerBatch={20}
      />
    </ScrollView>
  );
};
