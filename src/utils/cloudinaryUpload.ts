import { UploadApiResponse } from "cloudinary";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary";

const PRODUCT_FOLDER = "photoframebd/products";

export const ensureCloudinaryConfigured = (): void => {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file."
    );
  }
};

export const uploadImageToCloudinary = (
  buffer: Buffer
): Promise<string> => {
  ensureCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: PRODUCT_FOLDER, resource_type: "image" },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
};

export const uploadMultipleImages = async (
  files: Express.Multer.File[]
): Promise<string[]> => {
  return Promise.all(files.map((file) => uploadImageToCloudinary(file.buffer)));
};

export const getPublicIdFromUrl = (url: string): string | null => {
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;

    const pathWithoutVersion = parts[1].replace(/^v\d+\//, "");
    return pathWithoutVersion.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

export const deleteImageFromCloudinary = async (
  imageUrl: string
): Promise<void> => {
  if (!isCloudinaryConfigured()) return;

  const publicId = getPublicIdFromUrl(imageUrl);
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId);
};

export const deleteMultipleImages = async (
  imageUrls: string[]
): Promise<void> => {
  await Promise.all(imageUrls.map((url) => deleteImageFromCloudinary(url)));
};
