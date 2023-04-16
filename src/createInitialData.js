/**
 * @param {number} dimensions 
 * @returns {number[]}
 */
export const createInitialData = (dimensions) => {
  const initialData = new Array(dimensions * dimensions * 3).fill(0);

  for (let y = 0; y < dimensions; y++) {
    const yNorm = ((y / (dimensions - 1)) * 2) - 1;

    for (let x = 0; x < dimensions; x++) {
      const i = y * dimensions + x;
      const xNorm = ((x / (dimensions - 1)) * 2) - 1;

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