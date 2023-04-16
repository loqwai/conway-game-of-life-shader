import { initAutoResize } from "./resize.js";
import { createComputeProgram, bindComputeBuffer } from "./computeProgram.js";
import { createRenderProgram, bindRenderBuffer } from "./createRenderProgram.js";

export class ConwayGameOfLife {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {number} [dimensions=16] - The number of rows and columns in the grid. Must be a power of 2.
   * @param {string} [shaderBaseUrl="./shaders/"] - The path to the shaders. This is relative to the html file that loads this script.
   */
  constructor(canvas, dimensions = 16, shaderBaseUrl = "/src/shaders/") {
    this.canvas = canvas;
    this.dimensions = dimensions;
    this.shaderBaseUrl = shaderBaseUrl;
    this.running = false;
    this.gl = this.canvas.getContext("webgl2");
  }

  singleFrame = () => {
    if (!this.running) return;
    requestAnimationFrame(this.singleFrame); // registering this first thing so we can safely early return
  }

  start = async () => {
    this.running = true;
    initAutoResize(this.canvas);

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    const { stateBuffer, nextStateBuffer } = this._createStateBuffers(this.gl, this.dimensions)
    const { computeProgram, readComputeVao, writeComputeVao } = await this._createComputeProgram(stateBuffer, nextStateBuffer)
    const { renderProgram, readRenderVao, writeRenderVao } = await this._createRenderProgram(stateBuffer, nextStateBuffer)

    this.state = {
      compute: {
        program: computeProgram,
        read: {
          vao: readComputeVao,
          buffer: stateBuffer
        },
        write: {
          vao: writeComputeVao,
          buffer: nextStateBuffer
        },
      },
      render: {
        program: renderProgram,
        read: {
          vao: readRenderVao,
          buffer: nextStateBuffer
        },
        write: {
          vao: writeRenderVao,
          buffer: stateBuffer,
        },
      },
    }

    requestAnimationFrame(this.singleFrame);
  }

  stop = () => {
    this.running = false;
  }

  /**
   * create two buffers. One for the current state, one for the next state. We will swap them each frame.
   * @param {WebGl2RenderingContext} gl
   * @param {number} dimensions
   * @returns {{stateBuffer: WebGlBuffer, nextStateBuffer: WebGlBuffer}}
   */
  _createStateBuffers = (gl, dimensions) => {
    const stateBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, stateBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dimensions * dimensions), gl.DYNAMIC_DRAW);

    const nextStateBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nextStateBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dimensions * dimensions), gl.DYNAMIC_DRAW);

    return { stateBuffer, nextStateBuffer }
  }

  /**
   * @param {WebGlBuffer} stateBuffer 
   * @param {WebGlBuffer} nextStateBuffer 
   * @returns {Promise<{computeProgram: WebGlProgram, writeComputeVao: WebGlVertexArrayObject, readComputeVao: WebGlVertexArrayObject}>}
   */
  _createComputeProgram = async (stateBuffer, nextStateBuffer) => {
    const computeProgram = await createComputeProgram(this.gl, this.shaderBaseUrl);

    const readComputeVao = this.gl.createVertexArray()
    bindComputeBuffer(this.gl, computeProgram, readComputeVao, stateBuffer)

    const writeComputeVao = this.gl.createVertexArray()
    bindComputeBuffer(this.gl, computeProgram, writeComputeVao, nextStateBuffer)

    return { computeProgram, readComputeVao, writeComputeVao }
  }

  _createRenderProgram = async (stateBuffer, nextStateBuffer) => {
    const renderProgram = await createRenderProgram(this.gl, this.shaderBaseUrl);

    const readRenderVao = this.gl.createVertexArray()
    bindRenderBuffer(this.gl, renderProgram, readRenderVao, nextStateBuffer)

    const writeRenderVao = this.gl.createVertexArray()
    bindRenderBuffer(this.gl, renderProgram, writeRenderVao, stateBuffer)

    return { renderProgram, readRenderVao, writeRenderVao }
  }
}