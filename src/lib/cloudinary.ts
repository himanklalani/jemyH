import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export type UploadFolder = 'products' | 'prescriptions' | 'avatars' | 'blogs';

/**
 * Upload a file buffer to Cloudinary.
 * Returns the secure URL and public_id.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: UploadFolder
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `jemy/${folder}`,
        resource_type: 'auto',
        transformation:
          folder === 'products'
            ? [{ quality: 'auto', fetch_format: 'auto' }]
            : undefined,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Delete an asset from Cloudinary by its public_id.
 * Always call this when removing a product image or prescription file.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
