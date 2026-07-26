/**
 * File Security & Magic Bytes Validation
 * ISO/IEC 27001 & ISO-COMPLIANCE-BASELINE P0 verification:
 * Validates actual buffer headers (Magic Bytes) against declared MIME types
 * to prevent Content-Type spoofing and malicious binary uploads.
 */

export function validateFileMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (!buffer || buffer.length === 0) return false;

  const len = buffer.length;

  switch (mimeType) {
    case "application/pdf":
      // %PDF-
      return len >= 5 &&
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46 &&
        buffer[4] === 0x2d;

    case "image/jpeg":
      // 0xFF 0xD8 0xFF
      return len >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff;

    case "image/png":
      // 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
      return len >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a;

    case "image/webp":
      // RIFF....WEBP
      return len >= 12 &&
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50;

    case "image/gif":
      // GIF87a or GIF89a -> GIF8
      return len >= 4 &&
        buffer[0] === 0x47 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x38;

    case "video/mp4":
      // ftyp at offset 4 (0x66 0x74 0x79 0x70) or mdat/moov
      if (len >= 8 && buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
        return true;
      }
      // ISO Media / QuickTime box headers
      return len >= 8 && (
        (buffer[4] === 0x6d && buffer[5] === 0x6f && buffer[6] === 0x6f && buffer[7] === 0x76) || // moov
        (buffer[4] === 0x6d && buffer[5] === 0x64 && buffer[6] === 0x61 && buffer[7] === 0x74) || // mdat
        (buffer[4] === 0x66 && buffer[5] === 0x72 && buffer[6] === 0x65 && buffer[7] === 0x65)    // free
      );

    case "video/webm":
      // EBML header 0x1A 0x45 0xDF 0xA3
      return len >= 4 &&
        buffer[0] === 0x1a &&
        buffer[1] === 0x45 &&
        buffer[2] === 0xdf &&
        buffer[3] === 0xa3;

    case "application/msword":
    case "application/vnd.ms-powerpoint":
      // OLE2 Compound File Header (0xD0 0xCF 0x11 0xE0 0xA1 0xB1 0x1A 0xE1)
      return len >= 8 &&
        buffer[0] === 0xd0 &&
        buffer[1] === 0xcf &&
        buffer[2] === 0x11 &&
        buffer[3] === 0xe0 &&
        buffer[4] === 0xa1 &&
        buffer[5] === 0xb1 &&
        buffer[6] === 0x1a &&
        buffer[7] === 0xe1;

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      // Zip Archive Header (0x50 0x4B 0x03 0x04 or 0x50 0x4B 0x05 0x06 or 0x50 0x4B 0x07 0x08)
      return len >= 4 &&
        buffer[0] === 0x50 &&
        buffer[1] === 0x4b &&
        (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
        (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08);

    case "text/plain": {
      // Must not contain binary NUL bytes across the first 4096 bytes
      const checkLen = Math.min(len, 4096);
      for (let i = 0; i < checkLen; i++) {
        if (buffer[i] === 0x00) return false;
      }
      return true;
    }

    default:
      // If MIME is not in known binary headers list, reject by default to be conservative
      return false;
  }
}
