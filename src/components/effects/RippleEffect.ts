import {
  Mesh,
  Program,
  RenderTarget,
  Renderer,
  Triangle,
  Vec2,
  type OGLRenderingContext,
} from 'ogl';

const DEFAULT_VERTEX_SHADER =
  'attribute vec2 uv, position; varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }';

interface RenderTargetOptions {
  width: number;
  height: number;
  type?: GLenum;
}

const getRenderTargetOptions = (
  gl: OGLRenderingContext,
  { width, height, type }: RenderTargetOptions
) => {
  const webgl2Context = gl as WebGL2RenderingContext;
  const halfFloatExtension = gl.renderer.extensions.OES_texture_half_float as
    | { HALF_FLOAT_OES?: GLenum }
    | undefined;
  const resolvedType =
    type ??
    (gl.renderer.isWebgl2 ? webgl2Context.HALF_FLOAT : halfFloatExtension?.HALF_FLOAT_OES) ??
    gl.UNSIGNED_BYTE;

  return {
    width,
    height,
    type: resolvedType,
    internalFormat: gl.renderer.isWebgl2
      ? resolvedType === webgl2Context.FLOAT
        ? webgl2Context.RGBA32F
        : webgl2Context.RGBA16F
      : gl.RGBA,
    depth: false,
    unpackAlignment: 1,
  };
};

class GpgpuPass {
  readonly gl: OGLRenderingContext;
  readonly width: number;
  readonly height: number;
  readonly numVertexes: number;
  readonly mesh: Mesh<Triangle, Program>;
  read: RenderTarget;
  write: RenderTarget;

  constructor(gl: OGLRenderingContext, { width, height, type }: RenderTargetOptions) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.numVertexes = width * height;
    this.read = new RenderTarget(gl, getRenderTargetOptions(gl, { width, height, type }));
    this.write = new RenderTarget(gl, getRenderTargetOptions(gl, { width, height, type }));
    this.mesh = new Mesh(gl, { geometry: new Triangle(gl) });
  }

  renderProgram(program: Program) {
    this.mesh.program = program;
    this.gl.renderer.render({
      scene: this.mesh,
      target: this.write,
      clear: false,
    });
    this.swap();
  }

  private swap() {
    [this.read, this.write] = [this.write, this.read];
  }
}

class RippleEffect {
  readonly renderer: Renderer;
  readonly gl: OGLRenderingContext;
  readonly width: number;
  readonly height: number;
  readonly delta: Vec2;
  readonly gpgpu: GpgpuPass;
  private updateProgram: Program;
  private dropProgram: Program;

  constructor(renderer: Renderer) {
    const width = 512;
    const height = 512;

    this.renderer = renderer;
    this.gl = renderer.gl;
    this.width = width;
    this.height = height;
    this.delta = new Vec2(1 / width, 1 / height);
    this.gpgpu = new GpgpuPass(renderer.gl, { width, height });
    this.updateProgram = this.createUpdateProgram();
    this.dropProgram = this.createDropProgram();
  }

  update() {
    this.updateProgram.uniforms.tDiffuse.value = this.gpgpu.read.texture;
    this.gpgpu.renderProgram(this.updateProgram);
  }

  addDrop(x: number, y: number, radius: number, strength: number) {
    this.dropProgram.uniforms.tDiffuse.value = this.gpgpu.read.texture;
    this.dropProgram.uniforms.uCenter.value.set(x, y);
    this.dropProgram.uniforms.uRadius.value = radius;
    this.dropProgram.uniforms.uStrength.value = strength;
    this.gpgpu.renderProgram(this.dropProgram);
  }

  private createUpdateProgram() {
    return new Program(this.gl, {
      uniforms: {
        tDiffuse: { value: null },
        uDelta: { value: this.delta },
      },
      vertex: DEFAULT_VERTEX_SHADER,
      fragment: `
        precision highp float;

        uniform sampler2D tDiffuse;
        uniform vec2 uDelta;

        varying vec2 vUv;

        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          vec2 dx = vec2(uDelta.x, 0.0);
          vec2 dy = vec2(0.0, uDelta.y);
          float average = (
            texture2D(tDiffuse, vUv - dx).r +
            texture2D(tDiffuse, vUv - dy).r +
            texture2D(tDiffuse, vUv + dx).r +
            texture2D(tDiffuse, vUv + dy).r
          ) * 0.25;

          texel.g += (average - texel.r) * 2.0;
          texel.g *= 0.8;
          texel.r += texel.g;

          gl_FragColor = texel;
        }
      `,
    });
  }

  private createDropProgram() {
    return new Program(this.gl, {
      uniforms: {
        tDiffuse: { value: null },
        uCenter: { value: new Vec2() },
        uRadius: { value: 0.05 },
        uStrength: { value: 0.05 },
      },
      vertex: DEFAULT_VERTEX_SHADER,
      fragment: `
        precision highp float;

        const float PI = 3.1415926535897932384626433832795;

        uniform sampler2D tDiffuse;
        uniform vec2 uCenter;
        uniform float uRadius;
        uniform float uStrength;

        varying vec2 vUv;

        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          float drop = max(0.0, 1.0 - length(uCenter * 0.5 + 0.5 - vUv) / uRadius);
          drop = 0.5 - cos(drop * PI) * 0.5;
          texel.r += drop * uStrength;
          gl_FragColor = texel;
        }
      `,
    });
  }
}

export default RippleEffect;
