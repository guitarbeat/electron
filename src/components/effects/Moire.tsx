import React, { useEffect, useRef } from 'react';
import {
  Camera,
  Color,
  Geometry,
  Mesh,
  Program,
  Renderer,
  Vec2,
  type OGLRenderingContext,
} from 'ogl';
import { useTheme } from '@/app/providers';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import RippleEffect from './RippleEffect';

interface MoireProps {
  isVisible: boolean;
}

interface Cancelable {
  cancel: () => void;
}

interface MoireRuntime {
  renderer: Renderer;
  gl: OGLRenderingContext;
  camera: Camera;
  mouse: Vec2;
  ripple: RippleEffect;
  points: Mesh<Geometry, Program> | null;
  width: number;
  height: number;
  wWidth: number;
  gridRatio: number;
  cameraZ: number;
  mouseOver: boolean;
  hasNewMouseInput: boolean;
  color1: Color;
  color2: Color;
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const DESKTOP_POINT_SPACING = 3;
const MOBILE_POINT_SPACING = 5;

const debounce = <TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delay: number
): ((...args: TArgs) => void) & Cancelable => {
  let timeoutId: number | null = null;

  const debounced = (...args: TArgs) => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      timeoutId = null;
      callback(...args);
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
};

const throttle = <TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  wait: number
): ((...args: TArgs) => void) & Cancelable => {
  let lastExecution = 0;
  let timeoutId: number | null = null;
  let trailingArgs: TArgs | null = null;

  const invoke = (args: TArgs) => {
    lastExecution = Date.now();
    callback(...args);
  };

  const throttled = (...args: TArgs) => {
    const now = Date.now();
    const remaining = wait - (now - lastExecution);
    trailingArgs = args;

    if (remaining <= 0) {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }

      trailingArgs = null;
      invoke(args);
      return;
    }

    if (timeoutId === null) {
      timeoutId = window.setTimeout(() => {
        timeoutId = null;
        if (trailingArgs) {
          const nextArgs = trailingArgs;
          trailingArgs = null;
          invoke(nextArgs);
        }
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
    trailingArgs = null;
  };

  return throttled;
};

const getWorldSize = (camera: Camera): [number, number] => {
  const verticalFieldOfView = (camera.fov * Math.PI) / 180;
  const height = 2 * Math.tan(verticalFieldOfView / 2) * Math.abs(camera.position.z);
  const width = height * camera.aspect;

  return [width, height];
};

const getPointSpacing = (viewportWidth: number) =>
  viewportWidth <= 768 ? MOBILE_POINT_SPACING : DESKTOP_POINT_SPACING;

const Moire: React.FC<MoireProps> = ({ isVisible }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<MoireRuntime | null>(null);
  const { themeTokens } = useTheme();
  const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  useEffect(() => {
    if (prefersReducedMotion) {
      return undefined;
    }

    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const renderer = new Renderer({ dpr: 1 });
    const gl = renderer.gl;
    const camera = new Camera(gl, { fov: 45 });
    const runtime: MoireRuntime = {
      renderer,
      gl,
      camera,
      mouse: new Vec2(),
      ripple: new RippleEffect(renderer),
      points: null,
      width: 0,
      height: 0,
      wWidth: 0,
      gridRatio: 1,
      cameraZ: 50,
      mouseOver: false,
      hasNewMouseInput: false,
      // Theme colors are applied by the dedicated update effect below so we
      // do not need to recreate the canvas when the theme changes.
      color1: new Color('#000000'),
      color2: new Color('#000000'),
    };

    runtimeRef.current = runtime;
    container.appendChild(gl.canvas);
    camera.position.set(0, 0, 50);
    gl.clearColor(1, 1, 1, 1);

    const initPointsMesh = () => {
      const spacing = getPointSpacing(runtime.width);
      const worldPointSize = (spacing * runtime.wWidth) / runtime.width;
      const columns = Math.floor(runtime.width / spacing) + 1;
      const rows = Math.floor(runtime.height / spacing) + 1;
      const pointCount = columns * rows;
      const offsetX = -worldPointSize * (columns / 2 - 0.5);
      const offsetY = -worldPointSize * (rows / 2 - 0.5);
      const positions = new Float32Array(pointCount * 3);
      const uvs = new Float32Array(pointCount * 2);
      const sizes = new Float32Array(pointCount);

      runtime.gridRatio = runtime.width / runtime.height;

      let uvX: number;
      let uvY: number;
      let uvDeltaX: number;
      let uvDeltaY: number;

      if (runtime.gridRatio >= 1) {
        uvX = 0;
        uvDeltaX = 1 / columns;
        uvY = (1 - 1 / runtime.gridRatio) / 2;
        uvDeltaY = 1 / rows / runtime.gridRatio;
      } else {
        uvX = (1 - runtime.gridRatio) / 2;
        uvDeltaX = runtime.gridRatio / columns;
        uvY = 0;
        uvDeltaY = 1 / rows;
      }

      for (let column = 0; column < columns; column += 1) {
        const x = offsetX + column * worldPointSize;

        for (let row = 0; row < rows; row += 1) {
          const pointIndex = column * rows + row;
          positions.set([x, offsetY + row * worldPointSize, 0], pointIndex * 3);
          uvs.set([uvX + column * uvDeltaX, uvY + row * uvDeltaY], pointIndex * 2);
          sizes[pointIndex] = spacing / 2;
        }
      }

      const geometry = new Geometry(runtime.gl, {
        position: { size: 3, data: positions },
        uv: { size: 2, data: uvs },
        size: { size: 1, data: sizes },
      });

      if (runtime.points) {
        runtime.points.geometry = geometry;
        return;
      }

      const program = new Program(runtime.gl, {
        uniforms: {
          hmap: { value: runtime.ripple.gpgpu.read.texture },
          color1: { value: runtime.color1 },
          color2: { value: runtime.color2 },
        },
        vertex: `
          precision highp float;

          const float PI = 3.1415926535897932384626433832795;

          uniform mat4 modelViewMatrix;
          uniform mat4 projectionMatrix;
          uniform sampler2D hmap;
          uniform vec3 color1;
          uniform vec3 color2;

          attribute vec2 uv;
          attribute vec3 position;
          attribute float size;

          varying vec4 vColor;

          void main() {
            vec3 pos = position.xyz;
            vec4 htex = texture2D(hmap, uv);
            pos.z = 10.0 * htex.r;

            vec3 mixPct = vec3(0.0);
            mixPct.r = smoothstep(0.0, 0.5, htex.r);
            mixPct.g = sin(htex.r * PI);
            mixPct.b = pow(htex.r, 0.5);
            vColor = vec4(mix(color1, color2, mixPct), 1.0);

            gl_PointSize = size;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragment: `
          precision highp float;

          varying vec4 vColor;

          void main() {
            gl_FragColor = vColor;
          }
        `,
      });

      runtime.points = new Mesh(runtime.gl, {
        geometry,
        program,
        mode: runtime.gl.POINTS,
      });
    };

    const resize = () => {
      runtime.width = window.innerWidth;
      runtime.height = window.innerHeight;
      runtime.renderer.setSize(runtime.width, runtime.height);
      runtime.camera.perspective({ aspect: runtime.width / runtime.height });
      [runtime.wWidth] = getWorldSize(runtime.camera);
      initPointsMesh();
    };

    const updatePointer = (x: number, y: number) => {
      runtime.mouseOver = true;
      runtime.mouse.set(
        (x / runtime.gl.renderer.width) * 2 - 1,
        (1 - y / runtime.gl.renderer.height) * 2 - 1
      );

      if (runtime.gridRatio >= 1) {
        runtime.mouse.y /= runtime.gridRatio;
      } else {
        runtime.mouse.x /= runtime.gridRatio;
      }

      runtime.hasNewMouseInput = true;
    };

    const handleMouseMove = (event: MouseEvent) => {
      updatePointer(event.clientX, event.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) {
        return;
      }

      updatePointer(touch.pageX, touch.pageY);
    };

    const handlePointerLeave = () => {
      runtime.mouseOver = false;
    };

    const getScrollPercentage = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const { scrollHeight, clientHeight } = document.documentElement;
      const maxScroll = scrollHeight - clientHeight;

      if (maxScroll <= 0) {
        return 0;
      }

      return Math.min(Math.max(scrollTop / maxScroll, 0), 1);
    };

    const handleScroll = throttle(() => {
      runtime.cameraZ = 50 - getScrollPercentage() * 3;
    }, 16);

    const debouncedResize = debounce(resize, 200);

    let animationFrameId = 0;

    const animate = () => {
      animationFrameId = window.requestAnimationFrame(animate);
      runtime.camera.position.z += (runtime.cameraZ - runtime.camera.position.z) * 0.02;

      if (runtime.hasNewMouseInput) {
        runtime.ripple.addDrop(runtime.mouse.x, runtime.mouse.y, 0.05, 0.05);
        runtime.hasNewMouseInput = false;
      } else if (!runtime.mouseOver) {
        const time = Date.now() * 0.001;
        runtime.ripple.addDrop(Math.cos(time) * 0.2, Math.sin(time) * 0.2, 0.05, 0.05);
      }

      runtime.ripple.update();
      if (runtime.points) {
        runtime.renderer.render({ scene: runtime.points, camera: runtime.camera });
      }
    };

    resize();
    animate();

    window.addEventListener('resize', debouncedResize, false);
    document.addEventListener('scroll', handleScroll, { passive: true });

    if ('ontouchstart' in window) {
      document.body.addEventListener('touchstart', handleTouchMove, false);
      document.body.addEventListener('touchmove', handleTouchMove, false);
      document.body.addEventListener('touchend', handlePointerLeave, false);
    } else {
      document.body.addEventListener('mousemove', handleMouseMove, false);
      document.body.addEventListener('mouseleave', handlePointerLeave, false);
    }

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      debouncedResize.cancel();
      handleScroll.cancel();
      window.removeEventListener('resize', debouncedResize, false);
      document.removeEventListener('scroll', handleScroll);

      if ('ontouchstart' in window) {
        document.body.removeEventListener('touchstart', handleTouchMove, false);
        document.body.removeEventListener('touchmove', handleTouchMove, false);
        document.body.removeEventListener('touchend', handlePointerLeave, false);
      } else {
        document.body.removeEventListener('mousemove', handleMouseMove, false);
        document.body.removeEventListener('mouseleave', handlePointerLeave, false);
      }

      if (gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }

      runtimeRef.current = null;
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      return;
    }

    runtime.color1.set(themeTokens.accent);
    runtime.color2.set(themeTokens.secondary);
  }, [themeTokens.accent, themeTokens.secondary]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      id="magicContainer"
      ref={containerRef}
      className={`magic-container${isVisible ? ' magic-container--visible' : ''}`}
      aria-hidden="true"
    />
  );
};

export default Moire;
