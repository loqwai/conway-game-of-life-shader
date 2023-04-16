/**
 * @param {number} numX 
 * @param {number} numY 
 * @returns {number[]}
 */
export const createCells = (numX, numY) => {
  const initialData = new Array(numX * numY * 2).fill(0);

  for (let y = 0; y < numY; y++) {
    const yNorm = ((y / (numY - 1)) * 2) - 1;

    for (let x = 0; x < numX; x++) {
      const i = y * numX + x;
      const xNorm = ((x / (numX - 1)) * 2) - 1;

      const ix = i * 2;
      const iy = ix + 1;

      initialData[ix] = xNorm;
      initialData[iy] = yNorm;
    }

  }
  return initialData;
}