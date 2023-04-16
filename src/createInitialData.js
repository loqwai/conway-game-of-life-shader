/**
 * @param {number} numX 
 * @param {number} numY 
 * @returns {number[]}
 */
export const createInitialData = (numX, numY) => {
  const initialData = new Array(numX * numY * 3).fill(0);

  for (let y = 0; y < numY; y++) {
    const yNorm = ((y / (numY - 1)) * 2) - 1;

    for (let x = 0; x < numX; x++) {
      const i = y * numX + x;
      const xNorm = ((x / (numX - 1)) * 2) - 1;

      const alive = Math.random() > 0.5 ? 1 : 0;

      const ix = i * 3;
      const iy = ix + 1;
      const ialive = ix + 2;

      initialData[ix] = xNorm;
      initialData[iy] = yNorm;
      initialData[ialive] = alive;
    }

  }
  return initialData;
}