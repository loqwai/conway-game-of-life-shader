
/**
 * This function creates the initial texture for the game of life.
 * @param {number} numX 
 * @param {number} numY 
 * @returns {UInt8Array}
 */
export const createInitialTexture = (numX, numY) => {
  const size = numX * numY;
  const data = new Uint8Array(size).fill(255);

  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() > 0.5 ? 255 : 0;
  }

  return data;
}