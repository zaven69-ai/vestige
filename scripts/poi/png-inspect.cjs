// Read-only PNG validation: no image conversion or modification.
const zlib = require("node:zlib");
function inspectPng(bytes) {
  const width = bytes.readUInt32BE(16),
    height = bytes.readUInt32BE(20);
  if (bytes[24] !== 8 || bytes[25] !== 6 || bytes[28] !== 0)
    throw Error("Expected a non-interlaced 8-bit RGBA PNG.");
  const chunks = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset),
      type = bytes.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT")
      chunks.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const data = zlib.inflateSync(Buffer.concat(chunks)),
    stride = width * 4,
    colors = new Set();
  let previous = Buffer.alloc(stride),
    transparent = 0,
    opaque = 0,
    solid = 0;
  const corners = [];
  const paeth = (a, b, c) => {
    const p = a + b - c,
      pa = Math.abs(p - a),
      pb = Math.abs(p - b),
      pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = data[y * (stride + 1)],
      row = Buffer.allocUnsafe(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? row[x - 4] : 0,
        b = previous[x],
        c = x >= 4 ? previous[x - 4] : 0;
      const predictor =
        filter === 0
          ? 0
          : filter === 1
            ? a
            : filter === 2
              ? b
              : filter === 3
                ? Math.floor((a + b) / 2)
                : filter === 4
                  ? paeth(a, b, c)
                  : NaN;
      if (!Number.isFinite(predictor)) throw Error("Invalid PNG filter");
      row[x] = (data[y * (stride + 1) + 1 + x] + predictor) & 255;
    }
    if (y === 0 || y === height - 1) corners.push(row[3], row[stride - 1]);
    for (let x = 0; x < stride; x += 4) {
      const alpha = row[x + 3];
      if (alpha === 0) transparent++;
      if (alpha === 255) opaque++;
      if (alpha >= 250) solid++;
      if (alpha > 200 && x % 52 === 0 && y % 13 === 0)
        colors.add(row[x] * 65536 + row[x + 1] * 256 + row[x + 2]);
    }
    previous = row;
  }
  return {
    width,
    height,
    transparent,
    opaque,
    solid,
    corners,
    sampledColors: colors.size,
  };
}
module.exports = { inspectPng };
