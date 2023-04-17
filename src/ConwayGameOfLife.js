import { initAutoResize, resizeCanvasToDisplaySize } from "./resize.js";
import { createCells as createCellPositions } from "./createCells.js";
import { createComputeProgram, bindComputeBuffer } from "./computeProgram.js";
import { createRenderProgram, bindRenderBuffer } from "./renderProgram.js";
import { printResults, tagObject } from "./shaderUtils.js";
import { createInitialTexture } from "./createInitialTexture.js";

export class ConwayGameOfLife {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {number} [resolution=16] - number of pixels per cell
   * @param {string} [shaderBaseUrl="./shaders/"] - The path to the shaders. This is relative to the html file that loads this script.
   */
  constructor(canvas, resolution = 16, shaderBaseUrl = 'https://raw.githubusercontent.com/loqwai/conway-game-of-life-shader/main/src/shaders') {
    resizeCanvasToDisplaySize(canvas);
    this.canvas = canvas;
    this.resolution = resolution;
    this.numX = Math.floor(this.canvas.width / resolution);
    this.numY = Math.floor(this.canvas.height / resolution)
    this.numCells = this.numX * this.numY;
    this.bufferSize = this.numCells * 3;
    this.shaderBaseUrl = shaderBaseUrl;
    this.running = false;
    this.gl = this.canvas.getContext("webgl2");
    this.resolutionMultiplier = 1

    this.underPopulationLimit = 2;
    this.overPopulationLimit = 3;
    this.numNeighborsToReproduce = 3;
  }

  setResolutionMultiplier = (multiplier) => {
    this.resolutionMultiplier = multiplier
  }

  setUnderPopulationLimit = (limit) => {
    this.underPopulationLimit = limit
  }

  setOverPopulationLimit = (limit) => {
    this.overPopulationLimit = limit
  }

  setNumNeighborsToReproduce = (num) => {
    this.numNeighborsToReproduce = num
  }

  singleFrame = () => {
    if (!this.running) return;

    this._compute()
    this._render();
    this._swapBuffers();

    requestAnimationFrame(this.singleFrame);
  }

  _cleanup = () => {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    this.gl.bindBuffer(this.gl.TRANSFORM_FEEDBACK_BUFFER, null);
    this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, null);
    this.gl.bindVertexArray(null);
    this.gl.disable(this.gl.RASTERIZER_DISCARD);
  }

  _clear = () => {
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }


  _compute = () => {
    this._clear()

    const fb = this.gl.createFramebuffer();
    tagObject(this.gl, fb, "output texture frambuffer");
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.state.cellStates.next, 0);

    // Resize our viewport to match the output texture
    this.gl.viewport(0, 0, this.numX, this.numY);

    this.gl.useProgram(this.state.compute.program);
    this.gl.bindVertexArray(this.state.compute.vao);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.state.cellStates.current); // input texture
    this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);
    this.gl.uniform1f(this.state.compute.attribs.resolutionX, this.resolutionMultiplier / this.numX);
    this.gl.uniform1f(this.state.compute.attribs.resolutionY, this.resolutionMultiplier / this.numY);
    this.gl.uniform1f(this.state.compute.attribs.underPopulationLimit, this.underPopulationLimit);
    this.gl.uniform1f(this.state.compute.attribs.overPopulationLimit, this.overPopulationLimit);
    this.gl.uniform1f(this.state.compute.attribs.numNeighborsToReproduce, this.numNeighborsToReproduce);
    this.gl.drawArrays(this.gl.POINTS, 0, this.numCells);

    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, null, 0);
    this._cleanup()
  }

  _render = () => {
    this._clear()

    // render the cell state texture
    this.gl.useProgram(this.state.render.program);
    this.gl.bindVertexArray(this.state.render.vao);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.state.cellStates.next);
    this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    this._cleanup()
  }

  _swapBuffers = () => {
    const newNext = this.state.cellStates.current;
    this.state.cellStates.current = this.state.cellStates.next;
    this.state.cellStates.next = newNext;
  }

  start = async () => {
    this.running = true;
    initAutoResize(this.canvas);

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    const cellPositions = this._createCellPositionsBuffer(createCellPositions(this.numX, this.numY))
    const textureVerticesBuffer = this._createTextureVerticesBuffer()
    const textureCoordsBuffer = this._createTextureCoordsBuffer()

    const { stateTexture, nextStateTexture } = this._createStateTextures(createInitialTexture(this.numX, this.numY))
    const { computeProgram, computeVao, computeAttribs } = await this._createComputeProgram(cellPositions)
    const { renderProgram, renderVao } = await this._createRenderProgram(textureVerticesBuffer, textureCoordsBuffer)

    this.state = {
      cellPositions,
      cellStates: {
        current: stateTexture,
        next: nextStateTexture,
        vertices: textureVerticesBuffer,
        coords: textureCoordsBuffer,
      },
      compute: {
        program: computeProgram,
        vao: computeVao,
        attribs: computeAttribs,
      },
      render: {
        program: renderProgram,
        vao: renderVao,
      },
    }

    requestAnimationFrame(this.singleFrame);
  }


  stop = () => {
    this.running = false;
  }

  /**
   * create a buffer to hold the cell positions
   * @param {WebGl2RenderingContext} gl
   * @param {number[]} initialCells
   * @returns {{stateBuffer: WebGlBuffer, nextStateBuffer: WebGlBuffer}}
   */
  _createCellPositionsBuffer = (initialCells) => {
    const cellsBuffer = this.gl.createBuffer();
    tagObject(this.gl, cellsBuffer, "cellsBuffer");
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, cellsBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(initialCells), this.gl.DYNAMIC_DRAW);

    return cellsBuffer
  }

  /**
   * create a buffer to hold the cell positions
   * @param {Uint8Array} data
   * @returns {{stateTexture: WebGlTexture, nextStateTexture: WebGlTexture}}
   */
  _createStateTextures = (data) => {
    return {
      stateTexture: this._createTexture(data, "stateTexture"),
      nextStateTexture: this._createTexture(data, "nextStateTexture"),
    }
  }

  /**
   * create a webgl texture from a Uint8Array
   * @param {Uint8Array} data
   * @returns {WebGLTexture}
   */
  _createTexture = (data, tag) => {
    const texture = this.gl.createTexture();
    tagObject(this.gl, texture, tag)
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.R8, this.numX, this.numY, 0, this.gl.RED, this.gl.UNSIGNED_BYTE, data, 0);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_R, this.gl.CLAMP_TO_EDGE);
    this._cleanup();
    return texture;
  }

  /**
   * @param {WebGlBuffer} cellPositions
   * @returns {Promise<{computeProgram: WebGlProgram, computeVao: WebGlVertexArrayObject, computeAttribs: {resolutionX: WebGLUniformLocation, resolutionY: WebGLUniformLocation}}>}
   */
  _createComputeProgram = async (cellPositions) => {
    const computeProgram = await createComputeProgram(this.gl, this.shaderBaseUrl);
    tagObject(this.gl, computeProgram, "computeProgram")

    const computeVao = this.gl.createVertexArray()
    tagObject(this.gl, computeVao, "computeVao")
    bindComputeBuffer(this.gl, computeProgram, computeVao, cellPositions)

    const computeAttribs = {
      resolutionX: this.gl.getUniformLocation(computeProgram, 'resolutionX'),
      resolutionY: this.gl.getUniformLocation(computeProgram, 'resolutionY'),
      underPopulationLimit: this.gl.getUniformLocation(computeProgram, 'underPopulationLimit'),
      overPopulationLimit: this.gl.getUniformLocation(computeProgram, 'overPopulationLimit'),
      numNeighborsToReproduce: this.gl.getUniformLocation(computeProgram, 'numNeighborsToReproduce'),
    }

    this._cleanup();
    return { computeProgram, computeVao, computeAttribs }
  }

  /**
   * @param {WebGlBuffer} textureVertices
   * @param {WebGlBuffer} textureCoords
   * @returns {Promise<{computeProgram: WebGlProgram, renderVao: WebGlVertexArrayObject}>}
   */
  _createRenderProgram = async (textureVertices, textureCoords) => {
    const renderProgram = await createRenderProgram(this.gl, this.shaderBaseUrl);
    tagObject(this.gl, renderProgram, "renderProgram")

    const renderVao = this.gl.createVertexArray()
    tagObject(this.gl, renderVao, "renderVao")
    bindRenderBuffer(this.gl, renderProgram, renderVao, textureVertices, textureCoords)

    this._cleanup()
    return { renderProgram, renderVao }
  }

  /**
   * @returns {WebGlBuffer}
   */
  _createTextureVerticesBuffer = () => {
    this._cleanup()
    const buffer = this.gl.createBuffer()
    tagObject(this.gl, buffer, "textureVerticesBuffer")
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      // triangle 1
      -1, -1,
      -1, 1,
      1, -1,
      // triangle 2
      1, -1,
      -1, 1,
      1, 1,
    ]), this.gl.STATIC_DRAW) // Two triangles covering the entire screen
    this._cleanup()
    return buffer
  }

  /**
   * @returns {WebGlBuffer}
   */
  _createTextureCoordsBuffer = () => {
    const buffer = this.gl.createBuffer()
    tagObject(this.gl, buffer, "textureCoordsBuffer")
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      // triangle 1
      0, 0,
      0, 1,
      1, 0,
      // triangle 2
      1, 0,
      0, 1,
      1, 1,
    ]), this.gl.STATIC_DRAW) // Two triangles covering the entire texture
    this._cleanup()
    return buffer
  }
}