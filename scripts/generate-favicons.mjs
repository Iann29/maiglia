import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const svgBuffer = readFileSync(join(publicDir, "maiglia-leaf.svg"));

// Generate apple-touch-icon (180x180 PNG)
await sharp(svgBuffer)
  .resize(180, 180, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png()
  .toFile(join(publicDir, "apple-touch-icon.png"));

console.log("✅ apple-touch-icon.png (180x180) generated");

// Generate favicon-32 (32x32 PNG, will be used as favicon)
await sharp(svgBuffer)
  .resize(32, 32, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png()
  .toFile(join(publicDir, "favicon-32x32.png"));

console.log("✅ favicon-32x32.png (32x32) generated");

// Generate favicon-16 (16x16 PNG)
await sharp(svgBuffer)
  .resize(16, 16, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png()
  .toFile(join(publicDir, "favicon-16x16.png"));

console.log("✅ favicon-16x16.png (16x16) generated");

// Generate ICO from the 32x32 PNG
// ICO format: header (6 bytes) + entry (16 bytes) + PNG data
const png32 = readFileSync(join(publicDir, "favicon-32x32.png"));

const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0);     // Reserved
icoHeader.writeUInt16LE(1, 2);     // Type: ICO
icoHeader.writeUInt16LE(1, 4);     // Number of images

const icoEntry = Buffer.alloc(16);
icoEntry.writeUInt8(32, 0);        // Width
icoEntry.writeUInt8(32, 1);        // Height
icoEntry.writeUInt8(0, 2);         // Color palette
icoEntry.writeUInt8(0, 3);         // Reserved
icoEntry.writeUInt16LE(1, 4);      // Color planes
icoEntry.writeUInt16LE(32, 6);     // Bits per pixel
icoEntry.writeUInt32LE(png32.length, 8);  // Image size
icoEntry.writeUInt32LE(22, 12);    // Offset (6 + 16 = 22)

const ico = Buffer.concat([icoHeader, icoEntry, png32]);
writeFileSync(join(publicDir, "favicon.ico"), ico);

console.log("✅ favicon.ico generated");
console.log("Done! All favicons generated in public/");
