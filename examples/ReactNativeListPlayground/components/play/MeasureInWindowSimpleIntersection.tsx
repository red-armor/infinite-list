import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ScrollView, View, Text } from 'react-native';
import {
  IntersectionObserver,
  ReactNativeDocumentBase,
} from '@infinite-list/intersection-observer';

const MeasureInWindowSimple = () => {
  const greenRef = useRef<View>(null);
  const secondRef = useRef<View>(null);
  const nestRef = useRef<View>(null);
  const outsideRef = useRef<ScrollView>(null);
  const nestScrollViewRef = useRef<ScrollView>(null);

  const root = useMemo(() => {
    return new ReactNativeDocumentBase({
      node: outsideRef,
    });
  }, []);

  const observer = useMemo<IntersectionObserver>(() => {
    return new IntersectionObserver(
      () => {
        console.log('hello');
      },
      {
        root: root,
        document: root,
      }
    );
  }, []);

  useEffect(() => {
    setTimeout(() => {
      observer.observe(secondRef.current, {
        root,
        observerKey: 'second',
      });
    }, 40);
    return () => {
      observer.unobserve(secondRef.current);
    };
  }, []);

  const onContentSizeChange = useCallback((e) => {
    console.log('cconte----');
    observer.updateDocumentIntersections(e);
  }, []);

  console.log('hello ----', observer);

  useEffect(() => {
    greenRef.current?.measureInWindow((x, y, width, height) => {
      console.log('green ref ', x, y, width, height);
    });
    nestScrollViewRef.current?.measureInWindow((x, y, width, height) => {
      console.log('nestScrollViewRef ref ', x, y, width, height);
    });
  }, []);

  const scrollHandler = useCallback((scrollEvent) => {
    onContentSizeChange(scrollEvent);
    greenRef.current?.measureInWindow((x, y, width, height) => {
      console.log('green ref ', x, y, width, height);
    });
  }, []);
  const horizontalScrollHandler = useCallback(() => {
    greenRef.current?.measureInWindow((x, y, width, height) => {
      console.log('green ref ', x, y, width, height);
    });
    nestRef.current?.measureInWindow((x, y, width, height) => {
      console.log('nest ref ', x, y, width, height);
    });
  }, []);
  const nestVerticalScrollHandler = useCallback(() => {
    greenRef.current?.measureInWindow((x, y, width, height) => {
      console.log('green ref ', x, y, width, height);
    });
    nestRef.current?.measureInWindow((x, y, width, height) => {
      console.log('nest ref ', x, y, width, height);
    });
  }, []);

  return (
    <ScrollView
      ref={outsideRef}
      style={{ flex: 1 }}
      onScroll={scrollHandler}
      scrollEventThrottle={50}
      onContentSizeChange={onContentSizeChange}
    >
      <View style={{ height: 300, width: '100%', backgroundColor: 'red' }}>
        <Text>first</Text>
      </View>
      <View
        ref={secondRef}
        style={{ height: 100, width: '100%', backgroundColor: 'pink' }}
      >
        <Text>second</Text>
      </View>
      <ScrollView
        horizontal
        onScroll={horizontalScrollHandler}
        scrollEventThrottle={50}
        ref={nestScrollViewRef}
      >
        <View style={{ height: 300, width: 200, backgroundColor: 'blue' }}>
          <Text>blue</Text>
        </View>
        <View style={{ height: 300, width: 200, backgroundColor: 'brown' }}>
          <Text>brown</Text>
          <ScrollView
            onScroll={nestVerticalScrollHandler}
            scrollEventThrottle={50}
          >
            <View
              style={{ height: 50, width: 200, backgroundColor: 'red' }}
            ></View>
            <View
              style={{ height: 30, width: 200, backgroundColor: 'yellow' }}
            ></View>
            <View
              style={{ height: 40, width: 200, backgroundColor: 'green' }}
            ></View>
            <View
              style={{ height: 100, width: 200, backgroundColor: '#000' }}
            ></View>
            <View
              ref={nestRef}
              style={{ height: 50, width: 200, backgroundColor: '#fff' }}
            ></View>
            <View
              style={{ height: 200, width: 200, backgroundColor: '#888' }}
            ></View>
            <View
              style={{ height: 70, width: 200, backgroundColor: '#aaa' }}
            ></View>
            <View
              style={{ height: 80, width: 200, backgroundColor: '#bbb' }}
            ></View>
          </ScrollView>
        </View>
        <View
          ref={greenRef}
          style={{ height: 300, width: 200, backgroundColor: 'green' }}
        >
          <Text>green</Text>
        </View>
        <View style={{ height: 300, width: 200, backgroundColor: 'grey' }}>
          <Text>grey</Text>
        </View>
      </ScrollView>

      <View style={{ height: 600, width: '100%', backgroundColor: 'green' }}>
        <Text>third</Text>
      </View>
    </ScrollView>
  );
};

export default MeasureInWindowSimple;
