import { v4 as uuidv4 } from "uuid";
import { supabase } from "./client";

// Types of supported buckets
type BucketName = "album-covers" | "avatars" | "track-urls";

interface UploadOptions {
    bucket: BucketName;
    file: File | Blob;
    path?: string; // optional custom path
    userId: string; // for structured paths
    albumName?: string; // for album-based organization
    trackName?: string; // for track-specific naming
    onUploadProgress?: (progress: number) => void;
}

/**
 * Uploads a file to the specified Supabase storage bucket.
 * Returns the public URL if successful.
 */
export async function uploadFile({
    bucket,
    file,
    path,
    userId,
    albumName,
    trackName,
    onUploadProgress,
}: UploadOptions): Promise<string | null> {
    const fileExt = (file instanceof File ? file.name.split(".").pop() : "bin") || "bin";

    let fileName: string;
    let filePath: string;

    if (bucket === "track-urls") {
        if (!albumName || !trackName) throw new Error("albumName and trackName are required for track upload");

        const sanitizedAlbum = albumName.replace(/[^a-zA-Z0-9\-_\s]/g, "").replace(/\s+/g, "-");
        const sanitizedTrack = trackName.replace(/[^a-zA-Z0-9\-_\s]/g, "").replace(/\s+/g, "-");
        const uniqueId = uuidv4().split("-")[0];
        fileName = `${sanitizedTrack}-${uniqueId}.${fileExt}`;
        filePath = `${userId}/${sanitizedAlbum}/${fileName}`;
    } else {
        fileName = `${uuidv4()}.${fileExt}`;
        filePath = path || (userId ? `${userId}/${fileName}` : fileName);
    }

    // Simulate progress if callback provided
    if (onUploadProgress) {
        let simulated = 0;
        const interval = setInterval(() => {
            simulated += Math.random() * 5;
            if (simulated >= 95) simulated = 95;
            onUploadProgress(Math.round(simulated));
        }, 200);

        const { error } = await supabase.storage.from(bucket).upload(filePath, file);
        clearInterval(interval);

        if (error) {
            console.error("Error uploading file:", error.message);
            return null;
        }

        onUploadProgress(100);
    } else {
        const { error } = await supabase.storage.from(bucket).upload(filePath, file);
        if (error) {
            console.error("Error uploading file:", error.message);
            return null;
        }
    }

    // Return appropriate URL / path
    if (bucket === "track-urls") {
        // For private bucket, return the path to generate signed URL later
        return filePath;
    } else {
        // Public bucket, return URL directly
        return getPublicUrl(bucket, filePath);
    }
}

/**
 * Returns the public URL for a file in a bucket.
 */
export function getPublicUrl(bucket: BucketName, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}

/**
 * Deletes a file from a bucket.
 */
export async function deleteFile(bucket: BucketName, path: string): Promise<boolean> {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
        console.error("Error deleting file:", error.message);
        return false;
    }
    return true;
}

/**
 * Lists all files in a given folder/path inside a bucket.
 */
export async function listFiles(bucket: BucketName, folder: string = "") {
    const { data, error } = await supabase.storage.from(bucket).list(folder);

    if (error) {
        console.error("Error listing files:", error.message);
        return [];
    }
    return data;
}
