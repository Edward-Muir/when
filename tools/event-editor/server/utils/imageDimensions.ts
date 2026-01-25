import https from 'https';
import http from 'http';

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Fetch image and determine dimensions from the response.
 * Works by reading enough bytes to parse image headers.
 * Supports PNG, JPEG, GIF, WebP, and SVG.
 */
export async function getImageDimensions(url: string): Promise<ImageDimensions | null> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(
      url,
      {
        headers: {
          'User-Agent': 'WhenGameEventEditor/1.0',
        },
      },
      (response) => {
        // Handle redirects
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          request.destroy();
          getImageDimensions(response.headers.location).then(resolve);
          return;
        }

        if (response.statusCode !== 200) {
          request.destroy();
          resolve(null);
          return;
        }

        const chunks: Buffer[] = [];
        let totalLength = 0;
        const maxBytes = 65536; // Read up to 64KB to get dimensions

        response.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
          totalLength += chunk.length;

          // Try to parse dimensions from accumulated data
          const buffer = Buffer.concat(chunks);
          const dimensions = parseImageDimensions(buffer);

          if (dimensions || totalLength >= maxBytes) {
            request.destroy();
            resolve(dimensions);
          }
        });

        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(parseImageDimensions(buffer));
        });

        response.on('error', () => {
          resolve(null);
        });
      }
    );

    request.on('error', () => {
      resolve(null);
    });

    request.setTimeout(10000, () => {
      request.destroy();
      resolve(null);
    });
  });
}

/**
 * Parse image dimensions from buffer.
 * Supports PNG, JPEG, GIF, WebP, and SVG.
 */
function parseImageDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 24) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    if (buffer.length >= 24) {
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
      };
    }
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return parseJpegDimensions(buffer);
  }

  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    if (buffer.length >= 10) {
      return {
        width: buffer.readUInt16LE(6),
        height: buffer.readUInt16LE(8),
      };
    }
  }

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return parseWebpDimensions(buffer);
  }

  // SVG: Check for XML/SVG text
  const text = buffer.toString('utf8', 0, Math.min(buffer.length, 1000));
  if (text.includes('<svg') || text.includes('<?xml')) {
    return parseSvgDimensions(text);
  }

  return null;
}

function parseJpegDimensions(buffer: Buffer): ImageDimensions | null {
  let offset = 2;

  while (offset < buffer.length - 8) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = buffer[offset + 1];

    // SOF markers (Start of Frame) contain dimensions
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      if (offset + 9 <= buffer.length) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
    }

    // Skip to next marker
    if (
      marker === 0xd8 ||
      marker === 0xd9 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      offset += 2;
    } else if (offset + 4 <= buffer.length) {
      const length = buffer.readUInt16BE(offset + 2);
      offset += 2 + length;
    } else {
      break;
    }
  }

  return null;
}

function parseWebpDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 30) return null;

  // VP8 format
  if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x20) {
    if (buffer.length >= 30) {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
  }

  // VP8L format
  if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x4c) {
    if (buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }
  }

  // VP8X format
  if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x58) {
    if (buffer.length >= 30) {
      return {
        width: (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16)) + 1,
        height: (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16)) + 1,
      };
    }
  }

  return null;
}

function parseSvgDimensions(text: string): ImageDimensions | null {
  const widthMatch = text.match(/width\s*=\s*["']?(\d+)/);
  const heightMatch = text.match(/height\s*=\s*["']?(\d+)/);

  if (widthMatch && heightMatch) {
    return {
      width: parseInt(widthMatch[1], 10),
      height: parseInt(heightMatch[1], 10),
    };
  }

  // Try viewBox
  const viewBoxMatch = text.match(/viewBox\s*=\s*["']?\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/);
  if (viewBoxMatch) {
    return {
      width: Math.round(parseFloat(viewBoxMatch[1])),
      height: Math.round(parseFloat(viewBoxMatch[2])),
    };
  }

  return null;
}
