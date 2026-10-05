// Background liquid-bronze wave shader — a full-screen plane parented to the camera.
import * as THREE from 'three';

export const shaderUniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uScroll: { value: 0 }
};

export function createBackgroundShader(camera) {
    const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        uniform float uScroll;

        // 3D Noise function for organic warping (high performance hash-based noise)
        float hash(float n) { return fract(sin(n) * 43758.5453123); }
        float noise(in vec3 x) {
            vec3 p = floor(x);
            vec3 f = fract(x);
            f = f*f*(3.0-2.0*f);
            float n = p.x + p.y*57.0 + 113.0*p.z;
            return mix(mix(mix(hash(n+  0.0), hash(n+  1.0), f.x),
                           mix(hash(n+ 57.0), hash(n+ 58.0), f.x), f.y),
                       mix(mix(hash(n+113.0), hash(n+114.0), f.x),
                           mix(hash(n+170.0), hash(n+171.0), f.x), f.y), f.z);
        }

        void main() {
            // Normalize UV coordinates
            vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
            float aspect = uResolution.x / uResolution.y;

            float time = uTime * 0.08; // Extremely slow, calm breathing speed
            float scroll = uScroll;

            // --- 1. Constant Wave Parameters (Perfect Scroll Stability) ---
            // Keep frequencies and angles constant to prevent compressing/speeding waves on scroll
            float angle1 = 0.6;
            float angle2 = -0.7;
            float angle3 = 1.2;

            float freq1 = 2.4;  // Higher frequency = significantly more lines on screen
            float freq2 = 3.2;
            float freq3 = 4.0;

            // --- 2. Coordinates Distortion (Smooth Rounded Arcs & Scroll Deformation) ---
            vec2 warpedUv = uv;

            // Scroll directly drives the deformation of the wave shapes!
            // As you scroll, the phase of the distortion shifts, smoothly bending the rounded lines.
            float scrollDeform = scroll * 5.0; // 5 radians of smooth sweeping deformation

            // Large scale, perfectly smooth sine-wave distortions for clean, even, rounded arcs
            warpedUv.x += sin(uv.y * 2.5 + time * 0.2 + scrollDeform) * 0.35;
            warpedUv.y += cos(uv.x * 2.5 - time * 0.15 - scrollDeform * 0.8) * 0.35;

            // Secondary clean curve to create elegant, topographical intersections
            warpedUv.x += sin(uv.y * 1.2 - time * 0.1 - scrollDeform * 1.5) * 0.25;
            warpedUv.y += cos(uv.x * 1.2 + time * 0.18 + scrollDeform * 1.2) * 0.25;

            // Soft global sliding shift based on scroll parallax and mouse movement
            // Keep drift multipliers tiny so scroll motion remains extremely gentle
            vec2 scrollDrift = vec2(scroll * 0.04, -scroll * 0.02);
            vec2 mouseShift = vec2(uMouse.x * aspect * 0.05, uMouse.y * 0.05);
            warpedUv += scrollDrift + mouseShift;

            // --- 3. Layered Wave Computations ---
            // Wave directions
            vec2 dir1 = vec2(cos(angle1), sin(angle1));
            vec2 dir2 = vec2(cos(angle2), sin(angle2));
            vec2 dir3 = vec2(cos(angle3), sin(angle3));

            // Layered sine wave calculations with self-warping
            float w1 = sin(dot(warpedUv, dir1) * freq1 + time * 1.0);
            float w2 = cos(dot(warpedUv, dir2) * freq2 - time * 1.4 + w1 * 0.4);
            float w3 = sin(dot(warpedUv, dir3) * freq3 + time * 1.8 + w2 * 0.5);

            // Combine layers into a seamless wave scalar field in [-1.0, 1.0]
            float waveField = w1 * 0.50 + w2 * 0.35 + w3 * 0.15;

            // --- 4. Crisp Metallic Lustre ---
            // Wide satin sheen (gives defined body to the folds without haze)
            float wideSheen = pow(max(0.0, 1.0 - abs(waveField - 0.1)), 2.5);

            // Crisp, thicker specular reflection (defined metallic shine, ensuring thickness with more lines)
            float crispSpecular = pow(max(0.0, 1.0 - abs(waveField - 0.15)), 8.0);

            // Highlight blend: crisp, defined glowing folds
            float crest = wideSheen * 0.5 + crispSpecular * 0.9;

            // --- 5. Scroll-Driven Color Palettes: Pure Bronze to Pure Blue ---
            // Top Palette (Scroll = 0.0): Rich Molten Bronze
            vec3 c0_shadow = vec3(0.0010, 0.0006, 0.0004); // Deepest bronze shadow
            vec3 c0_wave1  = vec3(0.085, 0.040, 0.015);    // Rich copper-bronze
            vec3 c0_wave2  = vec3(0.050, 0.022, 0.008);    // Deep bronze body
            vec3 c0_crest  = vec3(0.45, 0.30, 0.18);       // Polished bronze/gold sheen

            // Bottom Palette (Scroll = 1.0): Deep Sapphire Blue
            vec3 c1_shadow = vec3(0.0004, 0.0006, 0.0012); // Deepest sapphire shadow
            vec3 c1_wave1  = vec3(0.015, 0.035, 0.065);    // Rich cobalt/teal blue
            vec3 c1_wave2  = vec3(0.008, 0.020, 0.045);    // Deep sapphire body
            vec3 c1_crest  = vec3(0.18, 0.35, 0.55);       // Polished blue-steel sheen

            // Interpolate colors smoothly based on scroll progress
            float t = smoothstep(0.0, 1.0, scroll);
            vec3 colShadow = mix(c0_shadow, c1_shadow, t);
            vec3 colWave1  = mix(c0_wave1, c1_wave1, t);
            vec3 colWave2  = mix(c0_wave2, c1_wave2, t);
            vec3 colCrest  = mix(c0_crest, c1_crest, t);

            // --- 6. Final Composition ---
            // Blend wave details and wave bodies with deep shadow background
            vec3 color = colShadow;
            color = mix(color, colWave2, smoothstep(-0.6, 0.2, waveField));
            color = mix(color, colWave1, smoothstep(0.0, 0.8, waveField));

            // Add the soft satinated crest highlights with rich metallic multiplier
            color += colCrest * crest * 1.4;

            // Apply a gentle vignette to match cinematic design
            float vignette = 1.0 - dot(uv, uv) * 0.12;
            color *= vignette;

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    const bgMaterial = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: shaderUniforms,
        depthWrite: false,
        depthTest: false
    });

    const bgGeometry = new THREE.PlaneGeometry(30, 30);
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    bgMesh.position.set(0.0, 0.0, -8.0);   // local camera space, far behind
    bgMesh.renderOrder = -10;
    camera.add(bgMesh);                    // attach to camera so it always fills view
    return bgMaterial;
}
