import path from "path";

// Images are stored on the local filesystem (a Docker volume in production
// on Unraid) and served by /api/uploads/[filename] — no object storage needed.
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

export const IMAGE_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
