import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { Animated, PanResponder, StyleSheet, useAnimatedValue, View } from 'react-native';

const HANDLE_SIZE = 50;
const TRACK_PADDING = 4;

export function SlideToStart({ label, onComplete }: { label: string; onComplete: () => void }) {
  const styles = useMemo(() => makeStyles(), []);
  const [trackWidth, setTrackWidth] = useState(0);
  const pan = useAnimatedValue(0);
  const scale = useAnimatedValue(1);
  const idle = useAnimatedValue(0);
  const [done, setDone] = useState(false);
  const innerWidth = Math.max(0, trackWidth - TRACK_PADDING * 2);
  const maxDrag = Math.max(0, innerWidth - HANDLE_SIZE);

  const idleLoop = useMemo(
    () => Animated.loop(
      Animated.sequence([
        Animated.timing(idle, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(idle, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.delay(700),
      ])
    ),
    [idle]
  );

  useEffect(() => {
    idleLoop.start();
    return () => idleLoop.stop();
  }, [idleLoop]);

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => !done,
      onPanResponderGrant: () => {
        idleLoop.stop();
        idle.setValue(0);
        Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, stiffness: 400, damping: 20 }).start();
      },
      onPanResponderMove: (_evt, gesture) => {
        pan.setValue(Math.max(0, Math.min(maxDrag, gesture.dx)));
      },
      onPanResponderRelease: (_evt, gesture) => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, stiffness: 400, damping: 20 }).start();
        if (maxDrag > 0 && gesture.dx > maxDrag * 0.7) {
          setDone(true);
          Animated.timing(pan, { toValue: maxDrag, duration: 180, useNativeDriver: true }).start();
          onComplete();
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
            stiffness: 260,
            damping: 20,
            mass: 0.6,
          }).start(({ finished }) => {
            if (finished) idleLoop.start();
          });
        }
      },
    }),
    [done, idle, idleLoop, maxDrag, onComplete, pan, scale]
  );

  const labelOpacity = pan.interpolate({
    inputRange: [0, Math.max(1, maxDrag * 0.6)],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const handleTranslate = Animated.add(pan, idle.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }));
  const fillScale = Animated.divide(Animated.add(pan, HANDLE_SIZE / 2), Math.max(1, innerWidth));

  return (
    <View
      style={styles.track}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[
          styles.fill,
          { opacity: trackWidth ? 1 : 0, transform: [{ scaleX: fillScale }] },
        ]}
      >
        <LinearGradient
          colors={['#ff8a3d', '#ff3d5e', '#b3195c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.Text style={[styles.label, { opacity: trackWidth ? labelOpacity : 1 }]}>
        {label}
      </Animated.Text>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.handleShadow, { transform: [{ translateX: handleTranslate }, { scale }] }]}
      >
        <LinearGradient
          colors={['#ff8a3d', '#ff3d5e', '#b3195c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.handle}
        >
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </LinearGradient>
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
    fill: {
      position: 'absolute',
      left: TRACK_PADDING,
      right: TRACK_PADDING,
      top: TRACK_PADDING,
      bottom: TRACK_PADDING,
      transformOrigin: 'left center',
      borderRadius: (58 - TRACK_PADDING * 2) / 2,
      overflow: 'hidden',
    },
    handleShadow: {
      width: HANDLE_SIZE,
      height: HANDLE_SIZE,
      borderRadius: HANDLE_SIZE / 2,
      shadowColor: '#ff3d5e',
      shadowOpacity: 0.55,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 6,
    },
    handle: {
      width: HANDLE_SIZE,
      height: HANDLE_SIZE,
      borderRadius: HANDLE_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
