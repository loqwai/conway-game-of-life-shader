import { createShader, toBytes } from "./shaderUtils.js";

/**
 * @param {WebGL2RenderingContext} gl 
 * @param {string} shaderPathPrefix 
 * @returns {Promize<WebGLProgram>}
 */
export const createComputeProgram = async (gl, shaderPathPrefix) => {
  const program = gl.createProgram()

  gl.attachShader(program, await createShader(gl, gl.VERTEX_SHADER, `${shaderPathPrefix}/compute-vertex.glsl`))
  gl.attachShader(program, await createShader(gl, gl.FRAGMENT_SHADER, `${shaderPathPrefix}/compute-fragment.glsl`))

  gl.linkProgram(program);

  const status = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!status) {
    throw new Error(`Could not link render program. ${gl.getProgramInfoLog(program)}\n`);
  }
  return program;
}

/**
 * @param {WebGL2RenderingContext} gl 
 * @param {WebGLProgram} program 
 * @param {WebGLVertexArrayObject} vao 
 * @param {WebGLBuffer} buffer 
 */
export const bindComputeBuffer = (gl, program, vao, buffer) => {
  const positionAttrib = gl.getAttribLocation(program, "inPosition");

  gl.bindVertexArray(vao);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(positionAttrib);
  gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, toBytes(2), 0);
}
