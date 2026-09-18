import fs from "fs";
import path from "path";

/**
 * Ensures a directory exists synchronously.
 */
const ensureDir = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Decodes a base64 image data URI, saves it to the static uploads folder,
 * and returns the clean public URL.
 * If the input is already an HTTP(S) URL or relative path, it returns it unchanged.
 */
export const processBase64Image = (
  dataUriOrUrl: string | undefined | null,
  subDir: "avatars" | "covers" | "documents" = "avatars",
  filePrefix: string = "img"
): string => {
  if (!dataUriOrUrl || typeof dataUriOrUrl !== "string") {
    return "";
  }

  const trimmed = dataUriOrUrl.trim();

  // If it's not a base64 data URI, preserve existing URL (e.g. Unsplash, static path)
  if (!trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  const matches = trimmed.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!matches) {
    return trimmed;
  }

  let extension = matches[1].toLowerCase();
  if (extension === "jpeg") extension = "jpg";

  // Security guard: Disallow SVG to prevent embedded script execution (Stored XSS)
  const allowedExtensions = ["jpg", "png", "webp", "gif"];
  if (!allowedExtensions.includes(extension)) {
    return "";
  }

  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");

  // Enforce 5MB upload size limit
  if (buffer.length > 5 * 1024 * 1024) {
    return "";
  }

  // uploads directory at the root of backend
  const uploadsDir = path.resolve(__dirname, "../../uploads", subDir);
  ensureDir(uploadsDir);

  const cleanPrefix = filePrefix.replace(/[^a-zA-Z0-9_-]/g, "");
  const filename = `${cleanPrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${extension}`;
  const filePath = path.join(uploadsDir, filename);

  fs.writeFileSync(filePath, buffer);

  const serverUrl =
    process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${serverUrl}/uploads/${subDir}/${filename}`;
};
