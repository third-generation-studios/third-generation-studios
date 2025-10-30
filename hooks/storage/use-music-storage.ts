"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadFile, deleteFile } from "@/lib/supabase/storage";
import { useMusicInsert, useMusicUpdate } from "@/hooks/music/use-music";
import { QUERY_KEYS } from "@/lib/fetchers/query-keys";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/supabase-types";

// Insert types
type AlbumInsert = Database["public"]["Tables"]["albums"]["Insert"];
type TrackInsert = Database["public"]["Tables"]["tracks"]["Insert"];

// -------------------------
// ARTISTS
// -------------------------
export function useArtistAvatarUpload() {
    const qc = useQueryClient();
    const updateArtist = useMusicUpdate("profiles", "artists");

    return useMutation({
        mutationFn: async ({ artistId, file }: { artistId: string; file: File }) => {
            const url = await uploadFile({
                bucket: "avatars",
                file,
                userId: artistId,
            });

            if (!url) throw new Error("Failed to upload avatar");

            await updateArtist.mutateAsync({
                id: artistId,
                values: { avatar_url: url },
            });

            return url;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS["artists"].all }),
    });
}

// -------------------------
// ALBUMS
// -------------------------
export function useAlbumInsertWithCover() {
    const qc = useQueryClient();
    const insertAlbum = useMusicInsert("albums", "albums");
    const insertAlbumImage = useMusicInsert("album_images", "album_images");

    return useMutation({
        mutationFn: async ({ albumData, albumImageFile }: { albumData: AlbumInsert; albumImageFile?: File }) => {
            const album = await insertAlbum.mutateAsync(albumData);

            if (albumImageFile && album.artist_id) {
                const url = await uploadFile({
                    bucket: "album-covers",
                    file: albumImageFile,
                    userId: album.artist_id,
                });

                if (!url) throw new Error("Failed to upload album cover");

                await insertAlbumImage.mutateAsync({
                    album_id: album.id,
                    url,
                    name: albumImageFile.name,
                });
            }

            return album;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS["albums"].all }),
    });
}

export function useAlbumCoverUpdate() {
    const qc = useQueryClient();
    const insertAlbumImage = useMusicInsert("album_images", "album_images");
    const updateAlbumImage = useMusicUpdate("album_images", "album_images");

    return useMutation({
        mutationFn: async ({ albumId, artistId, albumImageFile }: { albumId: string; artistId: string; albumImageFile: File }) => {
            console.log("Starting album cover update...", { albumId, artistId, fileName: albumImageFile.name });

            // Upload new image file
            const url = await uploadFile({
                bucket: "album-covers",
                file: albumImageFile,
                userId: artistId,
            });

            if (!url) throw new Error("Failed to upload album cover to storage");

            console.log("File uploaded successfully:", url);

            try {
                // Query to find existing album image
                const { data: existingImages, error } = await supabase.from("album_images").select("id").eq("album_id", albumId).limit(1);

                if (error) throw error;

                if (existingImages && existingImages.length > 0) {
                    // Update existing image
                    await updateAlbumImage.mutateAsync({
                        id: existingImages[0].id,
                        values: {
                            url,
                            name: albumImageFile.name,
                        },
                    });
                    console.log("Album image updated successfully");
                } else {
                    // Insert new image
                    await insertAlbumImage.mutateAsync({
                        album_id: albumId,
                        url,
                        name: albumImageFile.name,
                    });
                    console.log("Album image inserted successfully");
                }

                return url;
            } catch (error) {
                console.error("Database operation failed:", error);
                throw new Error(`Failed to update album cover in database: ${error}`);
            }
        },
        onSuccess: (url) => {
            console.log("Album cover update completed successfully:", url);
            qc.invalidateQueries({ queryKey: QUERY_KEYS["albums"].all });
            qc.invalidateQueries({ queryKey: QUERY_KEYS["tracks"].all });
        },
        onError: (error) => {
            console.error("Album cover update failed:", error);
        },
    });
}

// -------------------------
// TRACKS
// -------------------------

// Helper function to get audio duration
export async function getAudioDuration(file: File): Promise<number> {
    // Ensure this only runs in the browser
    if (typeof window === "undefined") {
        console.warn("getAudioDuration called during SSR — skipping");
        return 0;
    }

    // Validate that we actually got a File object
    if (!(file instanceof File)) {
        console.error("getAudioDuration called with invalid file:", file);
        return 0;
    }

    return new Promise((resolve, reject) => {
        try {
            const audio = new Audio();
            const url = URL.createObjectURL(file);

            const cleanup = () => URL.revokeObjectURL(url);

            audio.addEventListener("loadedmetadata", () => {
                cleanup();
                resolve(Math.floor(audio.duration) || 0);
            });

            audio.addEventListener("error", () => {
                cleanup();
                reject(new Error("Could not load audio file metadata"));
            });

            audio.src = url;
        } catch (err) {
            reject(err);
        }
    });
}

export function useTrackUpload() {
    const qc = useQueryClient();
    const insertTrack = useMusicInsert("tracks", "tracks");
    const insertTrackImage = useMusicInsert("album_images", "album_images");

    return useMutation({
        mutationFn: async ({
            trackData,
            onProgress,
            audioFile,
            trackImageFile,
        }: {
            trackData: Omit<TrackInsert, "url" | "duration" | "plays" | "locked">;
            audioFile: File;
            trackImageFile?: File;
            onProgress?: (progress: number) => void;
        }) => {
            // Validate required fields
            if (!trackData.album_id || !trackData.artist_id || !trackData.title) {
                throw new Error("Missing required fields: album_id, artist_id, and title are required");
            }

            // Get audio duration
            const duration = await getAudioDuration(audioFile);

            // Upload audio file
            const audioUrl = await uploadFile({
                bucket: "track-urls",
                file: audioFile,
                userId: trackData.artist_id,
                albumName: trackData.title,
                trackName: trackData.title,
                onUploadProgress: (percent: number) => {
                    if (onProgress) onProgress(percent);
                },
            });

            if (!audioUrl) throw new Error("Failed to upload track file");

            // Create track record with all required fields
            const track = await insertTrack.mutateAsync({
                ...trackData,
                url: audioUrl,
                duration,
                plays: 0,
                locked: false,
                url_refreshed_at: new Date().toISOString(),
            });

            // Upload track image if provided (for singles)
            if (trackImageFile && track.artist_id && track.album_id) {
                const imageUrl = await uploadFile({
                    bucket: "album-covers",
                    file: trackImageFile,
                    userId: track.artist_id,
                    onUploadProgress: (percent: number) => {
                        // Optionally track image upload progress here
                        if (onProgress) onProgress(percent);
                    },
                });

                if (imageUrl) {
                    await insertTrackImage.mutateAsync({
                        album_id: track.album_id,
                        url: imageUrl,
                        name: trackImageFile.name,
                    });
                }
            }

            return track;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: QUERY_KEYS["tracks"].all });
            qc.invalidateQueries({ queryKey: QUERY_KEYS["albums"].all });
        },
    });
}

// -------------------------
// GENERIC STORAGE HELPERS
// -------------------------
export function useDeleteStorageFile(bucket: "avatars" | "album-covers" | "track-urls") {
    return useMutation({
        mutationFn: async (path: string) => {
            const success = await deleteFile(bucket, path);
            if (!success) throw new Error("Failed to delete file");
            return path;
        },
    });
}

// -------------------------
// COMPOSITE OPERATIONS
// -------------------------

export function useAlbumWithTrackUpload() {
    const qc = useQueryClient();
    const insertAlbum = useMusicInsert("albums", "albums");
    const insertTrack = useMusicInsert("tracks", "tracks");
    const insertAlbumImage = useMusicInsert("album_images", "album_images");

    return useMutation({
        mutationFn: async ({
            albumData,
            trackData,
            audioFile,
            coverImageFile,
        }: {
            albumData: AlbumInsert;
            trackData: Omit<TrackInsert, "album_id" | "artist_id" | "url" | "duration" | "plays" | "locked">;
            audioFile: File;
            coverImageFile?: File;
        }) => {
            // Validate required fields
            if (!albumData.artist_id) {
                throw new Error("Artist ID is required for album creation");
            }

            // Create album first
            const album = await insertAlbum.mutateAsync(albumData);

            // Get audio duration
            const duration = await getAudioDuration(audioFile);

            // Upload audio file
            const audioUrl = await uploadFile({
                bucket: "track-urls",
                file: audioFile,
                userId: album.artist_id,
                albumName: album.name || undefined,
                trackName: trackData.title || undefined,
            });

            if (!audioUrl) throw new Error("Failed to upload track file");

            // Create track with album reference
            const track = await insertTrack.mutateAsync({
                ...trackData,
                album_id: album.id,
                artist_id: album.artist_id,
                url: audioUrl,
                duration,
                plays: 0,
                locked: false,
            });

            // Upload cover image if provided
            if (coverImageFile && album.artist_id) {
                const imageUrl = await uploadFile({
                    bucket: "album-covers",
                    file: coverImageFile,
                    userId: album.artist_id,
                });

                if (imageUrl) {
                    await insertAlbumImage.mutateAsync({
                        album_id: album.id,
                        url: imageUrl,
                        name: coverImageFile.name,
                    });
                }
            }

            return { album, track };
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: QUERY_KEYS["albums"].all });
            qc.invalidateQueries({ queryKey: QUERY_KEYS["tracks"].all });
        },
    });
}

export function useTrackFileReplace() {
    const qc = useQueryClient();
    const updateTrack = useMusicUpdate("tracks", "tracks");
    const updateAlbum = useMusicUpdate("albums", "albums");

    return useMutation({
        mutationFn: async ({
            trackId,
            albumId,
            albumType,
            artistId,
            newFile,
            newTitle,
            albumName,
        }: {
            trackId: string;
            albumId: string;
            albumType: string;
            artistId: string;
            newFile: File;
            newTitle?: string;
            albumName?: string;
        }) => {
            // Get new audio duration
            const duration = await getAudioDuration(newFile);

            // Upload new audio file
            const newAudioUrl = await uploadFile({
                bucket: "track-urls",
                file: newFile,
                userId: artistId,
                albumName: albumName || undefined,
                trackName: newTitle || undefined,
            });

            if (!newAudioUrl) throw new Error("Failed to upload new track file");

            // Update track with new URL and duration
            const updatedTrack = await updateTrack.mutateAsync({
                id: trackId,
                values: {
                    url: newAudioUrl,
                    duration,
                    ...(newTitle && { title: newTitle }),
                },
            });

            // If album is a Single and we have a new title, update album name too
            if (albumType === "Single" && newTitle) {
                await updateAlbum.mutateAsync({
                    id: albumId,
                    values: { name: newTitle },
                });
            }

            return updatedTrack;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: QUERY_KEYS["tracks"].all });
            qc.invalidateQueries({ queryKey: QUERY_KEYS["albums"].all });
        },
    });
}
