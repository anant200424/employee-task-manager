import { v2 as cloudinary } from "cloudinary";
import { processBase64Image } from "../utils/fileUpload";

/**
 * Configure Cloudinary with environment variables.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
  secure: true,
});

/**
 * Checks whether Cloudinary credentials are fully specified in environment.
 */
export const isCloudinaryConfigured = (): boolean => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

export interface CloudinaryUploadResult {
  url: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
}

/**
 * Uploads an image (base64 data URI, buffer, or file path) to Cloudinary.
 * If Cloudinary credentials are not configured, falls back safely to local disk storage
 * so the system continues operating seamlessly in offline/dev environments.
 */
export const uploadImageToCloudinary = async (
  imageSource: string,
  folder: string = "empsphere/avatars",
  customPublicId?: string
): Promise<CloudinaryUploadResult> => {
  if (!imageSource || typeof imageSource !== "string") {
    return { url: "" };
  }

  const trimmed = imageSource.trim();

  // If already an external HTTP(S) URL (e.g. Unsplash or existing Cloudinary URL), return as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return { url: trimmed };
  }

  // If Cloudinary is configured, upload to Cloudinary cloud
  if (isCloudinaryConfigured()) {
    try {
      const uploadOptions: Record<string, unknown> = {
        folder: process.env.CLOUDINARY_FOLDER || folder,
        resource_type: "image",
        overwrite: true,
      };

      if (customPublicId) {
        const cleanId = customPublicId.replace(/[^a-zA-Z0-9_-]/g, "");
        if (cleanId) {
          uploadOptions.public_id = cleanId;
        }
      }

      const result = await cloudinary.uploader.upload(trimmed, uploadOptions);
      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
      };
    } catch (error: any) {
      console.error("[Cloudinary] Upload failed, falling back to local storage:", error?.message || error);
      // Fallback to local disk storage if Cloudinary upload errors
      const fallbackSubdir = folder.includes("cover") ? "covers" : "avatars";
      const localUrl = processBase64Image(trimmed, fallbackSubdir, customPublicId || "img");
      return { url: localUrl };
    }
  }

  // Fallback to local uploads when Cloudinary is not configured
  const fallbackSubdir = folder.includes("cover") ? "covers" : "avatars";
  const localUrl = processBase64Image(trimmed, fallbackSubdir, customPublicId || "img");
  return { url: localUrl };
};

/**
 * Deletes an image from Cloudinary given its publicId or Cloudinary URL.
 */
export const deleteCloudinaryImage = async (
  publicIdOrUrl: string
): Promise<boolean> => {
  if (!isCloudinaryConfigured() || !publicIdOrUrl) {
    return false;
  }

  try {
    let publicId = publicIdOrUrl;

    // If a full Cloudinary URL was provided, extract the public ID
    if (publicIdOrUrl.includes("res.cloudinary.com")) {
      const parts = publicIdOrUrl.split("/upload/");
      if (parts.length > 1) {
        // Strip version prefix if present (e.g. v1234567890/folder/image.jpg)
        const pathAfterUpload = parts[1].replace(/^v[0-9]+\//, "");
        // Strip file extension
        publicId = pathAfterUpload.replace(/\.[^/.]+$/, "");
      }
    }

    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === "ok";
  } catch (error: any) {
    console.warn("[Cloudinary] Delete error:", error?.message || error);
    return false;
  }
};

export default cloudinary;
