import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import './WaterSimulation.css';

interface Ripple {
  x: number;
  y: number;
  time: number;
  strength: number;
}

const MAX_RIPPLES = 10;

const WaterSimulation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationRef = useRef<number>(0);
  const ripplesRef = useRef<Ripple[]>([]);
  const uniformsRef = useRef<{
    u_time: { value: number };
    u_resolution: { value: THREE.Vector2 };
    u_mouse: { value: THREE.Vector2 };
    u_texture: { value: THREE.Texture | null };
    u_ripples: { value: number[] };
    u_rippleCount: { value: number };
  } | null>(null);

  const addRipple = useCallback((x: number, y: number, strength = 1.0) => {
    const ripple: Ripple = {
      x,
      y,
      time: 0,
      strength,
    };
    
    ripplesRef.current = [...ripplesRef.current.slice(-(MAX_RIPPLES - 1)), ripple];
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Shader uniforms
    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_texture: { value: null as THREE.Texture | null },
      u_ripples: { value: new Array(MAX_RIPPLES * 4).fill(0) },
      u_rippleCount: { value: 0 },
    };
    uniformsRef.current = uniforms;

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';
    textureLoader.load(
      'https://images2.alphacoders.com/137/1375140.png',
      (texture) => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        uniforms.u_texture.value = texture;
      }
    );

    // Vertex shader
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    // Fragment shader with water ripple effect
    const fragmentShader = `
      precision highp float;
      
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform sampler2D u_texture;
      uniform float u_ripples[${MAX_RIPPLES * 4}];
      uniform int u_rippleCount;
      
      varying vec2 vUv;
      
      // Simplex noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
      
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
      
      // Water ripple function
      float ripple(vec2 uv, vec2 center, float time, float strength) {
        float dist = distance(uv, center);
        float wave = sin(dist * 30.0 - time * 8.0) * exp(-dist * 4.0) * exp(-time * 1.5);
        return wave * strength * 0.03;
      }
      
      void main() {
        vec2 uv = vUv;
        float aspect = u_resolution.x / u_resolution.y;
        vec2 aspectUv = vec2(uv.x * aspect, uv.y);
        
        // Ambient water movement
        float time = u_time * 0.4;
        float noise1 = snoise(vec2(uv.x * 2.5 + time * 0.3, uv.y * 2.5 + time * 0.2)) * 0.012;
        float noise2 = snoise(vec2(uv.x * 4.0 - time * 0.25, uv.y * 4.0 + time * 0.15)) * 0.008;
        float noise3 = snoise(vec2(uv.x * 6.0 + time * 0.2, uv.y * 6.0 - time * 0.25)) * 0.005;
        
        vec2 distortion = vec2(noise1 + noise2 + noise3, noise1 * 0.7 + noise2 * 1.1 + noise3);
        
        // Mouse follow effect
        vec2 mouseInfluence = u_mouse - uv;
        float mouseDist = length(mouseInfluence);
        float mouseEffect = smoothstep(0.4, 0.0, mouseDist) * 0.02;
        distortion += mouseInfluence * mouseEffect;
        
        // Click ripples
        for (int i = 0; i < ${MAX_RIPPLES}; i++) {
          if (i >= u_rippleCount) break;
          int idx = i * 4;
          vec2 ripplePos = vec2(u_ripples[idx], u_ripples[idx + 1]);
          float rippleTime = u_ripples[idx + 2];
          float rippleStrength = u_ripples[idx + 3];
          
          vec2 rippleAspect = vec2(ripplePos.x * aspect, ripplePos.y);
          float rippleEffect = ripple(aspectUv, rippleAspect, rippleTime, rippleStrength);
          
          vec2 dir = normalize(uv - ripplePos + 0.001);
          distortion += dir * rippleEffect;
        }
        
        vec2 distortedUv = uv + distortion;
        
        // Clamp UV to prevent edge artifacts
        distortedUv = clamp(distortedUv, 0.001, 0.999);
        
        // Sample texture
        vec4 texColor = texture2D(u_texture, distortedUv);
        
        // Subtle color variation based on distortion
        float colorShift = (noise1 + noise2) * 1.5;
        texColor.r += colorShift * 0.06;
        texColor.g += colorShift * 0.03;
        texColor.b -= colorShift * 0.04;
        
        // Caustics overlay
        float caustics = snoise(vec2(uv.x * 12.0 + time * 0.8, uv.y * 12.0 - time * 0.4)) * 0.5 + 0.5;
        caustics = pow(caustics, 4.0) * 0.12;
        texColor.rgb += caustics * vec3(0.15, 0.25, 0.35);
        
        // Subtle vignette for depth
        float vignette = 1.0 - smoothstep(0.4, 1.4, length(uv - 0.5) * 1.2);
        texColor.rgb *= mix(0.85, 1.0, vignette);
        
        gl_FragColor = texColor;
      }
    `;

    // Create material and mesh
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      uniforms.u_mouse.value.x = e.clientX / window.innerWidth;
      uniforms.u_mouse.value.y = 1.0 - e.clientY / window.innerHeight;
    };

    // Click to add ripple
    const handleClick = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = 1.0 - e.clientY / window.innerHeight;
      addRipple(x, y, 1.0);
    };

    // Handle resize
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);

    // Animation loop
    let lastTime = performance.now();
    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      uniforms.u_time.value += deltaTime;
      
      // Update ripples
      ripplesRef.current = ripplesRef.current
        .map(r => ({ ...r, time: r.time + deltaTime }))
        .filter(r => r.time < 3.0);
      
      // Pack ripple data into uniform array
      const rippleData = new Array(MAX_RIPPLES * 4).fill(0);
      ripplesRef.current.forEach((ripple, i) => {
        const idx = i * 4;
        rippleData[idx] = ripple.x;
        rippleData[idx + 1] = ripple.y;
        rippleData[idx + 2] = ripple.time;
        rippleData[idx + 3] = ripple.strength;
      });
      uniforms.u_ripples.value = rippleData;
      uniforms.u_rippleCount.value = ripplesRef.current.length;
      
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [addRipple]);

  return <div ref={containerRef} className="water-simulation" />;
};

export default WaterSimulation;
