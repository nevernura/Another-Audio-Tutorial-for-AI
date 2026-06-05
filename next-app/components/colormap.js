// Magma-like colormap LUT (same inferno polynomial as the Python side), 256 RGB entries.
export const LUT = (() => {
  const C = [
    [0.00021894, 0.00165100, -0.01948090],
    [0.10651342, 0.56395644,  3.93271239],
    [11.6024931, -3.97285397, -15.9423941],
    [-41.7039961, 17.4363989,  44.3541452],
    [77.1629357, -33.4023589, -81.8073093],
    [-71.3194282, 32.6260643,  73.2095199],
    [25.1311262, -12.2426690, -23.0703250],
  ];
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    for (let k = 0; k < 3; k++) {
      let v = C[6][k];
      for (let j = 5; j >= 0; j--) v = C[j][k] + t * v;
      lut[i * 3 + k] = Math.max(0, Math.min(1, v)) * 255;
    }
  }
  return lut;
})();
