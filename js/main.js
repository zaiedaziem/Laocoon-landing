// Laocoön — Bronze and Time. Scene setup, lighting, pointer handling and the animation loop.
import * as THREE from 'three';
import './config.js';
import { createBackgroundShader, shaderUniforms } from './background.js';
import { createSparks, updateSparks } from './sparks.js';
import { loadModel, statue } from './model.js';
import { splitTitlesIntoChars, updateSlides, updateGridDots, setupNavigation } from './ui.js';

const canvas = document.querySelector('#webgl');
let scene, camera, renderer;
const clock = new THREE.Clock();
let currentScroll = 0;   // smoothed accumulated scroll for lerping

let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;

let cursorX = window.innerWidth / 2, cursorY = window.innerHeight / 2;
let outerCursorX = window.innerWidth / 2, outerCursorY = window.innerHeight / 2;

const sizes = { width: window.innerWidth, height: window.innerHeight };

/* ---------- Renderer, scene, camera ---------- */
scene = new THREE.Scene();
scene.background = new THREE.Color('#000000');
scene.fog = new THREE.FogExp2('#000000', 0.01);

camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 0.2, 3.0);
scene.add(camera);

createBackgroundShader(camera);   // adds the wave plane as a child of the camera

renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.2;

/* ---------- Dramatic lighting (chiaroscuro) ---------- */
const ambientLight = new THREE.AmbientLight('#ffffff', 0.1);
scene.add(ambientLight);

// Key light: super-bright white from upper-right, casts shadows
const keyLight = new THREE.SpotLight('#ffffff', 18.0);
keyLight.position.set(4, 6, 3);
keyLight.angle = Math.PI / 4;
keyLight.penumbra = 0.9;
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 1.0;
keyLight.shadow.camera.far = 15;
keyLight.shadow.bias = -0.001;
scene.add(keyLight);

// Rim light: cool blue from behind-left, defines the silhouette
const rimLight = new THREE.DirectionalLight('#e3f2ff', 10.0);
rimLight.position.set(-5, 3, -4);
scene.add(rimLight);

// Fill light: very faint warm cream from below-front
const fillLight = new THREE.DirectionalLight('#fff3e6', 0.8);
fillLight.position.set(-2, -4, 2);
scene.add(fillLight);

/* ---------- Resize ---------- */
function onWindowResize() {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (shaderUniforms) shaderUniforms.uResolution.value.set(sizes.width, sizes.height);
}

/* ---------- Pointer ---------- */
window.addEventListener('mousemove', (event) => {
    cursorX = event.clientX;
    cursorY = event.clientY;
    const cursorInner = document.querySelector('.cursor-inner');
    if (cursorInner) { cursorInner.style.left = `${cursorX}px`; cursorInner.style.top = `${cursorY}px`; }
    targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
    targetMouseY = (event.clientY / window.innerHeight) * 2 - 1;
});
window.addEventListener('resize', onWindowResize);

/* ---------- Animation loop ---------- */
function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    if (statue.mixer) statue.mixer.update(deltaTime);

    // 1. target scroll [0..1], cross-browser
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollTop = window.scrollY !== undefined ? window.scrollY
        : (window.pageYOffset !== undefined ? window.pageYOffset : document.documentElement.scrollTop);
    const targetScroll = maxScroll > 0 ? scrollTop / maxScroll : 0;

    // smooth physical lerp (inertia)
    currentScroll += (targetScroll - currentScroll) * 0.025;

    // smooth model rotation lerp
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    // outer cursor ring lerps toward inner
    outerCursorX += (cursorX - outerCursorX) * 0.2;
    outerCursorY += (cursorY - outerCursorY) * 0.2;
    const cursorOuter = document.querySelector('.cursor-outer');
    if (cursorOuter) { cursorOuter.style.left = `${outerCursorX}px`; cursorOuter.style.top = `${outerCursorY}px`; }

    // gentle interactive model tilt from mouse
    if (statue.pivot) {
        statue.pivot.rotation.y = mouseX * 0.25;
        statue.pivot.rotation.x = mouseY * 0.15;
    }

    // 2. sparks physics, accelerated/turbulent on fast scroll
    updateSparks(deltaTime, clock.getElapsedTime(), targetScroll, currentScroll);

    // 3. camera orbits the model 360° driven by scroll
    const phi = currentScroll * Math.PI * 2.0;
    const y = 0.35 + Math.sin(currentScroll * Math.PI) * 0.8;
    const radius = 4.2 - Math.sin(currentScroll * Math.PI) * 0.6;
    const x = radius * Math.sin(phi);
    const z = radius * Math.cos(phi);

    // shift the framing left on the first screen to clear room for the text columns
    let transitionProgress = Math.min(1.0, currentScroll / 0.28);
    let easeFactor = (Math.cos(transitionProgress * Math.PI) + 1.0) * 0.5; // 1.0 → 0.0
    const lookAtXOffset = -0.9 * easeFactor;
    const targetLookAt = new THREE.Vector3(lookAtXOffset, -0.15, 0);
    const targetPos = new THREE.Vector3(x, y, z);
    camera.position.lerp(targetPos, 0.025);
    camera.lookAt(targetLookAt);

    // background shader uniforms
    shaderUniforms.uTime.value = clock.getElapsedTime();
    shaderUniforms.uMouse.value.set(mouseX, -mouseY);
    shaderUniforms.uScroll.value = currentScroll;

    updateSlides(currentScroll);
    updateGridDots(currentScroll);
    renderer.render(scene, camera);
}

/* ---------- Bootstrap ---------- */
// Order matters: split titles, build the scene (done above), sparks, then the model,
// then start the loop and wire the nav.
splitTitlesIntoChars();
createSparks(scene);
loadModel(scene);
onWindowResize();
animate();
setupNavigation();
