import { initAutoResize } from "./resize.js";
import { createInitialData } from "./createInitialData.js";
import { createComputeProgram, bindComputeBuffer } from "./computeProgram.js";
import { createRenderProgram, bindRenderBuffer } from "./renderProgram.js";
import { tagObject } from "./shaderUtils.js";

export class ConwayGameOfLife {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {number} [dimensions=16] - The number of rows and columns in the grid. Must be a power of 2.
   * @param {string} [shaderBaseUrl="./shaders/"] - The path to the shaders. This is relative to the html file that loads this script.
   */
  constructor(canvas, dimensions = 16, shaderBaseUrl = "/src/shaders/") {
    this.canvas = canvas;
    this.dimensions = dimensions;
    this.numCells = dimensions * dimensions;
    this.shaderBaseUrl = shaderBaseUrl;
    this.running = false;
    this.gl = this.canvas.getContext("webgl2");
  }

  singleFrame = () => {
    if (!this.running) return;
    // requestAnimationFrame(this.singleFrame); // registering this first thing so we can safely early return

    // this._compute()
    this._render();
    this._swapBuffers();
  }

  _compute = () => {
    this.gl.useProgram(this.state.compute.program);

    // bind cell data
    this.gl.bindVertexArray(this.state.compute.read.vao);
    this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.state.compute.write.buffer);

    // run the compute shader
    this.gl.beginTransformFeedback(this.gl.POINTS);
    this.gl.drawArrays(this.gl.POINTS, 0, this.numCells);
    this.gl.endTransformFeedback();
  }

  _render = () => {
    // clear the screen
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // render the cells
    this.gl.useProgram(this.state.render.program);
    this.gl.bindVertexArray(this.state.render.read.vao);
    this.gl.drawArrays(this.gl.POINTS, 0, this.numCells);
  }

  _swapBuffers = () => {
    [this.state.compute.read, this.state.compute.write] = [this.state.compute.write, this.state.compute.read];
    [this.state.render.read, this.state.render.write] = [this.state.render.write, this.state.render.read];
  }

  start = async () => {
    this.running = true;
    initAutoResize(this.canvas);

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    const { stateBuffer, nextStateBuffer } = this._createStateBuffers(this.gl, createInitialData(this.dimensions))
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
   * @param {number[]} initialData
   * @returns {{stateBuffer: WebGlBuffer, nextStateBuffer: WebGlBuffer}}
   */
  _createStateBuffers = (gl, initialData) => {
    const stateBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, stateBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(initialData), gl.DYNAMIC_DRAW);

    const nextStateBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nextStateBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(initialData), gl.DYNAMIC_DRAW);

    return { stateBuffer, nextStateBuffer }
  }

  /**
   * @param {WebGlBuffer} stateBuffer 
   * @param {WebGlBuffer} nextStateBuffer 
   * @returns {Promise<{computeProgram: WebGlProgram, writeComputeVao: WebGlVertexArrayObject, readComputeVao: WebGlVertexArrayObject}>}
   */
  _createComputeProgram = async (stateBuffer, nextStateBuffer) => {
    const computeProgram = await createComputeProgram(this.gl, this.shaderBaseUrl);
    tagObject(this.gl, computeProgram, "computeProgram")

    const readComputeVao = this.gl.createVertexArray()
    bindComputeBuffer(this.gl, computeProgram, readComputeVao, stateBuffer)

    const writeComputeVao = this.gl.createVertexArray()
    bindComputeBuffer(this.gl, computeProgram, writeComputeVao, nextStateBuffer)

    return { computeProgram, readComputeVao, writeComputeVao }
  }

  _createRenderProgram = async (stateBuffer, nextStateBuffer) => {
    const renderProgram = await createRenderProgram(this.gl, this.shaderBaseUrl);
    tagObject(this.gl, renderProgram, "renderProgram")

    const readRenderVao = this.gl.createVertexArray()
    bindRenderBuffer(this.gl, renderProgram, readRenderVao, nextStateBuffer)

    const writeRenderVao = this.gl.createVertexArray()
    bindRenderBuffer(this.gl, renderProgram, writeRenderVao, stateBuffer)

    return { renderProgram, readRenderVao, writeRenderVao }
  }

}