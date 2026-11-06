import * as THREE from 'three';
import { END_Z, START_Z } from './layout';

// Camera walk path: a gentle wobble down the middle of the alley.
export const PATH = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 1.6, START_Z),
    new THREE.Vector3(0.1, 1.6, 5),
    new THREE.Vector3(0.15, 1.6, 0),
    new THREE.Vector3(-0.25, 1.6, -8),
    new THREE.Vector3(0.25, 1.6, -18),
    new THREE.Vector3(-0.2, 1.6, -28),
    new THREE.Vector3(0.2, 1.6, -38),
    new THREE.Vector3(-0.15, 1.6, -45),
    new THREE.Vector3(0, 1.6, END_Z),
  ],
  false,
  'catmullrom',
  0.5,
);
