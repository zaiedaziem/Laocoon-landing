// The bronze horse — loaded, given its bronze material, scaled to 3.5 and centred in a pivot group.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ASSET_BASE_URL, reportAssetError } from './config.js';

// Filled in once the GLB resolves; the animation loop reads it every frame.
export const statue = { pivot: null, mixer: null };

export function loadModel(scene) {
    const loader = new GLTFLoader();
    loader.load(
        ASSET_BASE_URL + '/bronze_horse.glb',
        (gltf) => {
            const gltfModel = gltf.scene;

            const modelPivot = new THREE.Group();
            scene.add(modelPivot);
            modelPivot.add(gltfModel);

            gltfModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.roughness = 0.42;   // semi-matte, noble highlights
                        child.material.metalness = 0.92;   // high satin-bronze metallic sheen
                        child.material.flatShading = false;
                        if (child.material.map) {
                            child.material.map.anisotropy = 16;
                        }
                    }
                }
            });

            if (gltf.animations && gltf.animations.length > 0) {
                statue.mixer = new THREE.AnimationMixer(gltfModel);
                gltf.animations.forEach((clip) => { statue.mixer.clipAction(clip).play(); });
            }

            // 1. scale so max dimension = 3.5
            const boxInitial = new THREE.Box3().setFromObject(gltfModel);
            const sizeInitial = boxInitial.getSize(new THREE.Vector3());
            const maxDim = Math.max(sizeInitial.x, sizeInitial.y, sizeInitial.z);
            const targetScale = 3.5 / (maxDim > 0.0001 ? maxDim : 1);
            gltfModel.scale.setScalar(targetScale);

            // 2. update world matrix so the box accounts for scale
            gltfModel.updateMatrixWorld(true);

            // 3. exact geometric center of the scaled model
            const boxScaled = new THREE.Box3().setFromObject(gltfModel);
            const centerScaled = boxScaled.getCenter(new THREE.Vector3());

            // 4. recenter model so its center sits at the pivot origin
            gltfModel.position.sub(centerScaled);

            // 5. lower the pivot for a grounded stance
            modelPivot.position.y = -0.4;

            statue.pivot = modelPivot;
        },
        undefined,
        (error) => {
            console.error('Error loading bronze horse model:', error);
            reportAssetError(ASSET_BASE_URL + '/bronze_horse.glb');
        }
    );
}
