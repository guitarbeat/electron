import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './WaterSimulation.css';

const WaterSimulation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Shader uniforms
    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_texture: { value: null as THREE.Texture | null },
    };

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      'https://images2.alphacoders.com/137/1375140.png',
      (texture) => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
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

    // Fragment shader with fluid simulation
    const fragmentShader = `
      precision highp float;
      
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform sampler2D u_texture;
      
      varying vec2 vUv;
      
      // Simplex noise functions
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
      
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                        + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                                dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
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
      
      void main() {
        vec2 uv = vUv;
        float aspect = u_resolution.x / u_resolution.y;
        
        // Create fluid distortion
        float time = u_time * 0.3;
        
        // Multiple layers of noise for complex fluid motion
        float noise1 = snoise(vec2(uv.x * 3.0 + time * 0.5, uv.y * 3.0 + time * 0.3)) * 0.02;
        float noise2 = snoise(vec2(uv.x * 5.0 - time * 0.4, uv.y * 5.0 + time * 0.2)) * 0.015;
        float noise3 = snoise(vec2(uv.x * 8.0 + time * 0.3, uv.y * 8.0 - time * 0.4)) * 0.01;
        
        // Mouse influence on distortion
        vec2 mouseInfluence = u_mouse - uv;
        float mouseDist = length(mouseInfluence);
        float mouseEffect = smoothstep(0.5, 0.0, mouseDist) * 0.03;
        
        // Apply distortion
        vec2 distortedUv = uv;
        distortedUv.x += noise1 + noise2 + noise3 + mouseInfluence.x * mouseEffect;
        distortedUv.y += noise1 * 0.8 + noise2 * 1.2 + noise3 + mouseInfluence.y * mouseEffect;
        
        // Sample texture with distortion
        vec4 texColor = texture2D(u_texture, distortedUv);
        
        // Add subtle color shift based on distortion
        float colorShift = (noise1 + noise2) * 2.0;
        texColor.r += colorShift * 0.1;
        texColor.b -= colorShift * 0.05;
        
        // Add subtle caustics effect
        float caustics = snoise(vec2(uv.x * 15.0 + time, uv.y * 15.0 - time * 0.5)) * 0.5 + 0.5;
        caustics = pow(caustics, 3.0) * 0.15;
        texColor.rgb += caustics * vec3(0.2, 0.3, 0.4);
        
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

    // Handle resize
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      uniforms.u_time.value += 0.016;
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="water-simulation" />;
};

export default WaterSimulation;
