declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import { Group, Loader } from 'three';

  export class GLTFLoader extends Loader {
    parse(
      data: ArrayBuffer | string,
      path: string,
      onLoad: (gltf: { scene: Group }) => void,
      onError?: (event: unknown) => void
    ): void;
  }
}
