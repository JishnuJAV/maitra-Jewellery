import { createHash } from 'node:crypto';
import { serverEnv } from '@/lib/env';

/**
 * Cloudinary integration.
 *
 * Uploads go BROWSER → CLOUDINARY directly, signed by this server. Routing file
 * bytes through a Vercel function instead would cap uploads at the 4.5 MB
 * request-body limit, which any phone video blows past immediately.
 *
 * The API secret never leaves the server; the browser only ever receives a
 * short-lived signature for one specific set of upload parameters.
 */

export const UPLOAD_FOLDER = 'maitra/products';

/** Cloudinary signs the sorted, &-joined parameter string plus the API secret. */
export function signUploadParams(params: Record<string, string | number>) {
  const { apiSecret } = serverEnv.cloudinary;

  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return createHash('sha1').update(`${toSign}${apiSecret}`).digest('hex');
}

export type SignedUpload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  uploadUrl: string;
};

export function createSignedUpload(resourceType: 'image' | 'video'): SignedUpload {
  const { cloudName, apiKey } = serverEnv.cloudinary;
  const timestamp = Math.floor(Date.now() / 1000);

  // Every parameter signed here is also enforced by Cloudinary at upload time,
  // so the browser cannot redirect the file to a different folder.
  const params = { folder: UPLOAD_FOLDER, timestamp };

  return {
    cloudName,
    apiKey,
    timestamp,
    signature: signUploadParams(params),
    folder: UPLOAD_FOLDER,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
  };
}

/** Removes an asset once its ProductMedia row is deleted, so storage isn't leaked. */
export async function deleteAsset(publicId: string, resourceType: 'image' | 'video' = 'image') {
  const { cloudName, apiKey } = serverEnv.cloudinary;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signUploadParams({ public_id: publicId, timestamp });

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
    { method: 'POST', body },
  );

  if (!response.ok) {
    // Non-fatal: a stale asset costs storage but must not block the admin's edit.
    console.error(`[cloudinary] Failed to delete ${publicId}: ${response.statusText}`);
  }
}

/**
 * Poster frame for a video, derived by swapping the delivery extension to .jpg.
 * Cloudinary generates it on the fly — no extra upload needed.
 */
export function videoPosterUrl(videoUrl: string): string {
  return videoUrl.replace(/\.(mp4|mov|webm|m4v|avi)(\?.*)?$/i, '.jpg');
}
