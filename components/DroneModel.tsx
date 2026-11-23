import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { MODEL_URL } from '../lib/api';

// Fetched once from the server (keeps the app bundle free of the 3D asset)
// and reused across every DroneModel instance mounted afterwards.
let modelBufferPromise: Promise<ArrayBuffer> | null = null;
function loadModelBuffer() {
  if (!modelBufferPromise) {
    modelBufferPromise = fetch(MODEL_URL)
      .then((res) => res.arrayBuffer())
      .catch((err) => {
        // Don't poison the cache forever on a transient failure (server was
        // down, wrong LAN IP, etc.) — let the next mount retry.
        modelBufferPromise = null;
        throw err;
      });
  }
  return modelBufferPromise;
}

type Props = {
  size?: number;
  autoRotateSpeed?: number;
  /** When set (radians), rotation sways/drags within [baseYaw - limit, baseYaw + limit]
   * instead of spinning freely — a subtle "look around" wobble rather than a full orbit. */
  swayLimit?: number;
  /** Starting yaw in radians. 0 = facing straight at the camera, 0.4 (default) = isometric angle. */
  baseYaw?: number;
  /** Backlight/rim light color (hex). Defaults to the brand red. */
  lightColor?: number;
};

export function DroneModel({
  size = 320,
  autoRotateSpeed = 0.35,
  swayLimit,
  baseYaw = 0.4,
  lightColor = 0xff3d5e,
}: Props) {
  const BASE_YAW = baseYaw;
  const rotationY = useRef(BASE_YAW);
  const rotationX = useRef(0.1);
  const dragging = useRef(false);
  const dragStartY = useRef(BASE_YAW);
  const dragStartX = useRef(0.1);
  const swayT = useRef(0);
  const modelRef = useRef<THREE.Group | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragging.current = true;
        dragStartY.current = rotationY.current;
        dragStartX.current = rotationX.current;
      },
      onPanResponderMove: (_evt, gesture) => {
        const targetY = dragStartY.current + gesture.dx * 0.012;
        rotationY.current =
          swayLimit != null
            ? Math.max(BASE_YAW - swayLimit, Math.min(BASE_YAW + swayLimit, targetY))
            : targetY;
        rotationX.current = Math.max(
          -0.5,
          Math.min(0.5, dragStartX.current - gesture.dy * 0.006)
        );
      },
      onPanResponderRelease: () => {
        dragging.current = false;
      },
    })
  ).current;

  const onContextCreate = async (gl: WebGLRenderingContext & { endFrameEXP: () => void }) => {
    try {
      await setupScene(gl);
    } catch (err) {
      console.warn('DroneModel: failed to load/render model:', err);
    }
  };

  const setupScene = async (gl: WebGLRenderingContext & { endFrameEXP: () => void }) => {
    // alpha: true + a zero-alpha clear color is what actually makes the
    // canvas transparent — without it the GL surface renders as an opaque
    // black square behind the model instead of showing the screen's own
    // background through it.
    const renderer = new Renderer({ gl, alpha: true });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0.35, 3.4);

    // Backlit silhouette: minimal front fill, strong rim/underglow (color set
    // by the caller) so the drone's body reads as a dark shape against its
    // own glow.
    scene.add(new THREE.AmbientLight(0xffffff, 0.08));
    const key = new THREE.DirectionalLight(0xffffff, 0.12);
    key.position.set(2, 3, 2);
    scene.add(key);
    const rim = new THREE.DirectionalLight(lightColor, 1.8);
    rim.position.set(-2, -1, -2);
    scene.add(rim);
    const underglow = new THREE.PointLight(lightColor, 2.6, 8);
    underglow.position.set(0, -1.6, 1.0);
    scene.add(underglow);
    const underglow2 = new THREE.PointLight(lightColor, 1.4, 6);
    underglow2.position.set(0, -1.8, -0.6);
    scene.add(underglow2);

    const buffer = await loadModelBuffer();

    const loader = new GLTFLoader();
    loader.parse(
      buffer,
      '',
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const sizeVec = new THREE.Vector3();
        box.getSize(sizeVec);
        const scale = 1.9 / Math.max(sizeVec.x, sizeVec.y, sizeVec.z, 0.001);
        const center = new THREE.Vector3();
        box.getCenter(center);
        model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        model.scale.setScalar(scale);
        modelRef.current = model;
        scene.add(model);
      },
      (err) => console.warn('GLB parse error:', err)
    );

    const render = () => {
      requestAnimationFrame(render);
      if (modelRef.current) {
        if (!dragging.current) {
          if (swayLimit != null) {
            swayT.current += 0.016;
            rotationY.current = BASE_YAW + Math.sin(swayT.current * autoRotateSpeed) * swayLimit;
          } else {
            rotationY.current += autoRotateSpeed * 0.016;
          }
        }
        modelRef.current.rotation.y = rotationY.current;
        modelRef.current.rotation.x = rotationX.current;
      }
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    render();
  };

  return (
    <View style={{ width: size, height: size }} {...panResponder.panHandlers}>
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
    </View>
  );
}
