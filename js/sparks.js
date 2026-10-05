// Forge sparks — 450 additive point particles that rise around the statue.
import * as THREE from 'three';

const sparkCount = 450;
const sparkData = [];
let sparkParticles;

function createSparkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(canvas);
}

export function createSparks(scene) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkCount * 3);
    const colors = new Float32Array(sparkCount * 3);

    for (let i = 0; i < sparkCount; i++) {
        const x = (Math.random() - 0.5) * 6.5;
        const y = (Math.random() - 0.5) * 5.0 - 0.5;
        const z = (Math.random() - 0.5) * 6.5;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        if (Math.random() < 0.6) {
            // saturated fiery orange
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 0.4 + Math.random() * 0.15;
            colors[i * 3 + 2] = 0.05 + Math.random() * 0.1;
        } else {
            // cosmic icy light-blue (matches rim light)
            colors[i * 3] = 0.55 + Math.random() * 0.15;
            colors[i * 3 + 1] = 0.82 + Math.random() * 0.12;
            colors[i * 3 + 2] = 1.0;
        }

        sparkData.push({
            speedX: (Math.random() - 0.5) * 0.4,
            speedY: 0.15 + Math.random() * 0.3,
            speedZ: (Math.random() - 0.5) * 0.4,
            swaySpeed: 0.5 + Math.random() * 1.5,
            swayRadius: 0.05 + Math.random() * 0.15,
            phase: Math.random() * Math.PI * 2
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.025,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        map: createSparkTexture()
    });

    sparkParticles = new THREE.Points(geometry, material);
    scene.add(sparkParticles);
}

// Sparks physics — accelerated and turbulent while the page is scrolling fast.
export function updateSparks(deltaTime, time, targetScroll, currentScroll) {
    if (!sparkParticles) return;
    const positions = sparkParticles.geometry.attributes.position.array;
    const scrollVelocity = Math.abs(targetScroll - currentScroll);
    const speedMultiplier = 1.0 + scrollVelocity * 9.0;
    const turbulence = scrollVelocity * 0.8;

    for (let i = 0; i < sparkCount; i++) {
        const idx = i * 3;
        const data = sparkData[i];
        positions[idx]     += data.speedX * deltaTime * speedMultiplier;
        positions[idx + 1] += data.speedY * deltaTime * speedMultiplier;
        positions[idx + 2] += data.speedZ * deltaTime * speedMultiplier;

        const currentSway = data.swayRadius * (1.0 + turbulence * 4.0);
        positions[idx]     += Math.sin(time * data.swaySpeed + data.phase) * currentSway * deltaTime;
        positions[idx + 2] += Math.cos(time * data.swaySpeed + data.phase) * currentSway * deltaTime;

        // recycle when out of bounds
        if (positions[idx + 1] > 3.0 || Math.abs(positions[idx]) > 3.5 || Math.abs(positions[idx + 2]) > 3.5) {
            positions[idx + 1] = -2.5;
            positions[idx]     = (Math.random() - 0.5) * 3.0;
            positions[idx + 2] = (Math.random() - 0.5) * 3.0;
        }
    }
    sparkParticles.geometry.attributes.position.needsUpdate = true;
}
