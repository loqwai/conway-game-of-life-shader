const fetchShader = async (filename) => (await fetch(filename)).text()


/**
 * @param {WebGL2RenderingContext} gl
 * @param {number} type
 * @param {string} url
 * @returns {Promise<WebGLShader>}
*/
export const createShader = async (gl, type, url) => {
  const shader = gl.createShader(type)
  const shaderSource = await fetchShader(url)
  gl.shaderSource(shader, shaderSource)
  gl.compileShader(shader, shaderSource)

  var status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!status) {
    throw new Error(`Could not compile shader "${url}": ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}

/**
 * @param {number} n 
 * @returns {number}
 */
export const toBytes = (n) => n * Float32Array.BYTES_PER_ELEMENT