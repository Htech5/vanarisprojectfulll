import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';

const HANDLE_SIZE = 50;
const TRACK_PADDING = 4;

export function SlideToStart({ label, onComplete }: { label: string; onComplete: () => void }) {
  const styles = useMemo(() => makeStyles(), []);
  const [trackWidth, setTrackWidth] = useState(0);
  const pan = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const idle = useRef(new Animated.Value(0)).current;
  const idleLoop = useRef<Animated.CompositeAnimation | null>(null);
  const maxDrag = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    idleLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(idle, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(idle, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.delay(700),
      ])
    );
    idleLoop.current.start();
    return () => idleLoop.current?.stop();
  }, [idle]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !done.current,
      onPanResponderGrant: () => {
        idleLoop.current?.stop();
        idle.setValue(0);
        Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, stiffness: 400, damping: 20 }).start();
      },
      onPanResponderMove: (_evt, gesture) => {
        const max = maxDrag.current;
        pan.setValue(Math.max(0, Math.min(max, gesture.dx)));
      },
      onPanResponderRelease: (_evt, gesture) => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, stiffness: 400, damping: 20 }).start();
        const max = maxDrag.current;
        if (max > 0 && gesture.dx > max * 0.7) {
          done.current = true;
          Animated.timing(pan, { toValue: max, duration: 180, useNativeDriver: true }).start();
          onComplete();
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
            stiffness: 260,
            damping: 20,
            mass: 0.6,
          }).start(() => idleLoop.current?.start());
        }
      },
    })
  ).current;

  const labelOpacity = pan.interpolate({
    inputRange: [0, Math.max(1, maxDrag.current * 0.6)],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const handleTranslate = Animated.add(pan, idle.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }));

  return (
    <View
      style={styles.track}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        setTrackWidth(w);
        maxDrag.current = Math.max(0, w - HANDLE_SIZE - TRACK_PADDING * 2);
      }}
    >
      <Animated.Text style={[styles.label, { opacity: trackWidth ? labelOpacity : 1 }]}>
        {label}
      </Animated.Text>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.handle, { transform: [{ translateX: handleTranslate }, { scale }] }]}
      >
        <Ionicons name="chevron-forward" size={20} color="#0a0a0c" />
      </Animated.View>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    track: {
      width: '100%',
      height: 58,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      justifyContent: 'center',
      padding: TRACK_PADDING,
      overflow: 'hidden',
    },
    label: {
      position: 'absolute',
      left: 0,
      right: 0,
      textAlign: 'center',
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 16,
      color: '#f4f4f5',
    },
    handle: {
      width: HANDLE_SIZE,
      height: HANDLE_SIZE,
      borderRadius: HANDLE_SIZE / 2,
      backgroundColor: '#f4f4f5',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
