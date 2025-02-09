import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ScrollView, View, Text } from 'react-native';
import {
  IntersectionObserver,
  ReactNativeDocumentBase,
} from '@infinite-list/intersection-observer/react-native';

const MeasureInWindowSimpleIntersection = () => {
  const greenRef = useRef<View>(null);
  const secondRef = useRef<View>(null);
  const nestRef = useRef<View>(null);
  const outsideRef = useRef<ScrollView>(null);
  const blueRef = useRef<View>(null);
  const nestScrollViewRef = useRef<ScrollView>(null);
  const nestVerticalScrollViewRef = useRef<ScrollView>(null);

  const root = useMemo(() => {
    return new ReactNativeDocumentBase({
      id: 'root',
      node: outsideRef,
    });
  }, []);

  const horizontalRoot = useMemo(() => {
    return new ReactNativeDocumentBase({
      id: 'horizontalRoot',
      node: nestScrollViewRef,
      ownerDocument: root,
    });
  }, []);

  const verticalRoot = useMemo(() => {
    return new ReactNativeDocumentBase({
      id: 'verticalRoot',
      node: nestVerticalScrollViewRef,
      ownerDocument: horizontalRoot,
    });
  }, []);

  const observer = useMemo<IntersectionObserver>(() => {
    return new IntersectionObserver(
      () => {
        console.log('hello');
      },
      {
        root: root,
        // document: root,
      }
    );
  }, []);

  useEffect(() => {
    observer.observe(secondRef.current, {
      root,
      observerKey: 'second',
    });
    observer.observe(blueRef.current, {
      root: horizontalRoot,
      observerKey: 'blue',
    });
    observer.observe(nestRef.current, {
      root: verticalRoot,
      observerKey: 'nest',
    });

    return () => {
      observer.unobserve(secondRef.current);
      observer.unobserve(blueRef.current);
      observer.unobserve(nestRef.current);
    };
  }, []);

  const onContentSizeChange = useCallback((e) => {
    // observer.updateIntersections();
  }, []);
  const onHorizontalContentSizeChange = useCallback((e) => {
    // observer.updateIntersections();
  }, []);
  const onNestVerticalContentSizeChange = useCallback((e) => {
    observer.updateIntersections();
  }, []);

  useEffect(() => {
    greenRef.current?.measureInWindow((x, y, width, height) => {
      console.log('green ref ', x, y, width, height);
    });
    nestScrollViewRef.current?.measureInWindow((x, y, width, height) => {
      console.log('nestScrollViewRef ref ', x, y, width, height);
    });
  }, []);

  const scrollHandler = useCallback((scrollEvent) => {
    root.onScrollEventChange(scrollEvent);
    greenRef.current?.measureInWindow((x, y, width, height) => {
      console.log('green ref ', x, y, width, height);
    });
  }, []);
  const horizontalScrollHandler = useCallback((scrollEvent) => {
    horizontalRoot.onScrollEventChange(scrollEvent);
    console.log('horizontalScrollHandler ');

    greenRef.current?.measureInWindow((x, y, width, height) => {
      console.log('green ref ', x, y, width, height);
    });
    nestRef.current?.measureInWindow((x, y, width, height) => {
      console.log('nest ref ', x, y, width, height);
    });
  }, []);
  const horizontalScrollHandler2 = useCallback((scrollEvent) => {
    horizontalRoot.onScrollEventChange(scrollEvent);
    console.log('horizontalScrollHandler 2');

    greenRef.current?.measureInWindow((x, y, width, height) => {
      console.log('green ref ', x, y, width, height);
    });
    nestRef.current?.measureInWindow((x, y, width, height) => {
      console.log('nest ref ', x, y, width, height);
    });
  }, []);
  const nestVerticalScrollHandler = useCallback((scrollEvent) => {
    verticalRoot.onScrollEventChange(scrollEvent);

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
      onScrollEndDrag={scrollHandler}
      scrollEventThrottle={50}
      onContentSizeChange={onContentSizeChange}
    >
      <View style={{ height: 700, width: '100%', backgroundColor: 'red' }}>
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
        onScrollEndDrag={horizontalScrollHandler2}
        scrollEventThrottle={16}
        ref={nestScrollViewRef}
        onContentSizeChange={onHorizontalContentSizeChange}
      >
        <View
          ref={blueRef}
          style={{ height: 300, width: 200, backgroundColor: 'blue' }}
        >
          <Text>blue</Text>
        </View>
        <View style={{ height: 300, width: 200, backgroundColor: 'brown' }}>
          <View style={{ height: 25 }}>
            <Text>brown</Text>
          </View>
          <ScrollView
            onContentSizeChange={onNestVerticalContentSizeChange}
            ref={nestVerticalScrollViewRef}
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
              style={{ height: 100, width: 200, backgroundColor: '#fff' }}
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

      <View style={{ height: 2000, width: '100%', backgroundColor: 'green' }}>
        <Text>third</Text>
      </View>
    </ScrollView>
  );
};

export default MeasureInWindowSimpleIntersection;
