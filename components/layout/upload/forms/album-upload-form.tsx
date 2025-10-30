"use client";

import React, { useState } from "react";
import { useUploadFormStore } from "@/stores/upload-form-store";
import { useUploadForm } from "@/hooks/music/upload/use-upload-form";
import UploadModeTabs from "../upload-mode-tabs";
import AlbumDetailsForm from "./album-details-form";
import TrackListEditor from "../track-list-editor";
import { useModalStore } from "@/stores/modal-store";
import { Button } from "@/components/ui/buttons/button";
import { useCreateAlbumWithImages, useUpdateAlbum, useAlbumImageManagement } from "@/hooks/music/use-albums";
import { useAuthStore } from "@/stores/auth-store";
import { useCreateTrackCredit } from "@/hooks/music/use-track-credits";
import { fetchAlbumsByArtist } from "@/lib/fetchers/album-fetchers";
import { AlbumType, TrackUploadData, TrackWithRelations, UploadMode } from "@/lib/types/database";
import MiniTrackCard from "../mini-track-card";
import { useTrackUpload } from "@/hooks/storage/use-music-storage";
import { useUpdateTrack, useCreateTrack } from "@/hooks/music/use-tracks";
import { uploadFile } from "@/lib/supabase/storage";

// Extended track type with file support for uploads
type TrackWithFile = TrackWithRelations & { file?: File };

export default function AlbumUploadUpdateForm() {
    // Track upload state management
    const [uploadingTracks, setUploadingTracks] = useState<TrackUploadData[]>([]);
    const [finishedTracks, setFinishedTracks] = useState<TrackUploadData[]>([]);
    const [failedTracks, setFailedTracks] = useState<TrackUploadData[]>([]);
    const [selectedType, setSelectedType] = React.useState<AlbumType>("Single");
    const [trackProgress, setTrackProgress] = useState<Record<string, number>>({});

    // Store and auth hooks
    const { user } = useAuthStore();
    const { tracks, albumData, trackCreditData, isEditing, setAlbumData } = useUploadFormStore();
    const openModal = useModalStore((state) => state.openModal);
    const closeModal = useModalStore((state) => state.closeModal);

    // Mutation hooks for DB operations
    const createAlbumWithImages = useCreateAlbumWithImages();
    const updateAlbumMutation = useUpdateAlbum();
    const { updateImage: updateAlbumImage, addImage: addAlbumImage } = useAlbumImageManagement(albumData.album_id || "");
    const trackUpload = useTrackUpload();
    const updateTrackMutation = useUpdateTrack();
    const createTrackCreditMutation = useCreateTrackCredit();

    const userId = user?.id as string;

    const handleAlbumTypeChange = (type: "Single" | "Album" | "Remix") => {
        setSelectedType(type);

        // ✅ Only update Zustand if changed
        if (albumData.type !== type) {
            setAlbumData({ type }); // This merges into albumData in your store
        }
    };

    // Main upload handler (INSERT mode)
    const handleUploadSubmit = async (data: any) => {
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Reset upload state
        setUploadingTracks([]);
        setFinishedTracks([]);
        setFailedTracks([]);
        setTrackProgress({});

        try {
            // Check for duplicate album names
            const artistAlbums = await fetchAlbumsByArtist(userId);
            const existingAlbums = artistAlbums.filter((album) => album.name.trim().toLowerCase() === albumData.name.trim().toLowerCase());
            if (existingAlbums.length > 0) {
                openModal("error", {
                    title: "Duplicate Album",
                    errors: ["An album with this name already exists for this artist."],
                });
                return;
            }

            // Handle full album upload
            if (albumData.type === "Album") {
                // Prepare album data
                const albumInsertData = {
                    name: albumData.name,
                    type: albumData.type,
                    artist_id: userId,
                    release_date: albumData.release_date ?? new Date().toISOString(),
                };

                // Prepare album images
                const albumImages = albumData.albumImageFile
                    ? [
                          {
                              name: albumData.name ?? "album-image",
                              file: albumData.albumImageFile,
                          },
                      ]
                    : [];

                // Create album with images (uploads to storage)
                const album = await createAlbumWithImages.mutateAsync({
                    albumData: albumInsertData,
                    images: albumImages,
                });

                // Upload each track
                for (let i = 0; i < tracks.length; i++) {
                    const track = tracks[i] as TrackWithFile;

                    // Set track as uploading
                    setUploadingTracks((prev) => [...prev, track]);
                    setTrackProgress((prev) => ({ ...prev, [track.id]: 0 }));

                    try {
                        // Upload audio file and create track record
                        const newTrack = await trackUpload.mutateAsync({
                            trackData: {
                                type: track.type,
                                title: track.title,
                                album_id: album.id,
                                artist_id: userId,
                                release_date: track.release_date ?? new Date().toISOString(),
                                links: track.links || [],
                                genre: track.genre,
                            },
                            audioFile: track.file!,
                            onProgress: (percent: number) => {
                                setTrackProgress((prev) => ({ ...prev, [track.id]: percent }));
                            },
                        });

                        // Mark track as finished
                        setTrackProgress((prev) => ({ ...prev, [track.id]: 100 }));
                        setFinishedTracks((prev) => [...prev, track]);
                        setUploadingTracks((prev) => prev.filter((t) => t.id !== track.id));

                        // Insert track credits
                        const credits = trackCreditData[track.id];
                        if (credits && Object.keys(credits).length > 0) {
                            await createTrackCreditMutation.mutateAsync({
                                track_id: newTrack.id,
                                artist_id: userId,
                                performed_by: credits.performed_by || [],
                                produced_by: credits.produced_by || [],
                                written_by: credits.written_by || [],
                                remixed_by: credits.remixed_by || [],
                            });
                        }
                    } catch (trackError) {
                        // Mark track as failed and stop upload
                        setUploadingTracks((prev) => prev.filter((t) => t.id !== track.id));
                        setFailedTracks((prev) => [...prev, track]);
                        throw trackError;
                    }
                }
            } else {
                // Handle single track upload
                const singleTrack = tracks[0];

                if (!singleTrack) {
                    throw new Error("No track found for single upload.");
                }

                // Create single album
                const albumInsertData = {
                    name: singleTrack.title || "Single",
                    type: "Single" as const,
                    artist_id: userId,
                    release_date: singleTrack.release_date ?? new Date().toISOString(),
                };

                const albumImages = albumData.albumImageFile
                    ? [
                          {
                              name: singleTrack.title ?? "single-image",
                              file: albumData.albumImageFile,
                          },
                      ]
                    : [];

                // Create single album with image
                const singleAlbum = await createAlbumWithImages.mutateAsync({
                    albumData: albumInsertData,
                    images: albumImages,
                });

                // Set track as uploading
                setUploadingTracks([singleTrack]);
                setTrackProgress({ [singleTrack.id]: 0 });

                try {
                    // Upload track
                    const newTrack = await trackUpload.mutateAsync({
                        trackData: {
                            type: singleTrack.type,
                            title: singleTrack.title,
                            album_id: singleAlbum.id,
                            artist_id: userId,
                            release_date: singleTrack.release_date ?? new Date().toISOString(),
                            links: singleTrack.links || [],
                            genre: singleTrack.genre,
                        },
                        audioFile: singleTrack.audioFile!,
                        onProgress: (percent: number) => {
                            setTrackProgress((prev) => ({ ...prev, [singleTrack.id]: percent }));
                        },
                    });

                    // Mark as finished
                    setTrackProgress((prev) => ({ ...prev, [singleTrack.id]: 100 }));
                    setFinishedTracks([singleTrack]);
                    setUploadingTracks([]);

                    // Insert credits
                    const credits = trackCreditData[singleTrack.id];
                    if (credits && Object.keys(credits).length > 0) {
                        await createTrackCreditMutation.mutateAsync({
                            track_id: newTrack.id,
                            artist_id: newTrack.artist_id, // <-- required
                            performed_by: credits.performed_by || [],
                            produced_by: credits.produced_by || [],
                            written_by: credits.written_by || [],
                            remixed_by: credits.remixed_by || [],
                        });
                    }
                } catch (trackError) {
                    // Mark as failed
                    setUploadingTracks([]);
                    setFailedTracks([singleTrack]);
                    throw trackError;
                }
            }

            // Show success modal
            openModal("success", {
                title: "Upload completed",
                onConfirm: () => closeModal(),
            });
        } catch (err) {
            // Clear uploading state on error
            setUploadingTracks([]);

            // Show error modal
            console.error("Upload error:", err);
            openModal("error", {
                title: "Upload failed",
                errors: [(err as Error).message || "An unknown error occurred during upload."],
            });
        }
    };

    // Main update handler (EDIT mode)
    const handleUpdateSubmit = async (data: any) => {
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Reset upload state
        setUploadingTracks([]);
        setFinishedTracks([]);
        setFailedTracks([]);
        setTrackProgress({});

        try {
            const albumId = albumData.album_id;
            if (!albumId) {
                throw new Error("Album ID is required for updates");
            }

            // Handle full album update
            if (albumData.type === "Album") {
                // Update album data
                const albumUpdateData = {
                    name: albumData.name,
                    type: albumData.type,
                    release_date: albumData.release_date ?? new Date().toISOString(),
                };

                await updateAlbumMutation.mutateAsync({
                    id: albumId,
                    updates: albumUpdateData,
                });

                // Update album image if a new one is provided
                if (albumData.albumImageFile) {
                    const imageUrl = await uploadFile({
                        bucket: "album-covers",
                        file: albumData.albumImageFile,
                        userId: userId,
                    });

                    if (imageUrl) {
                        // Try to update existing image, or add new one
                        try {
                            await updateAlbumImage(albumId, { url: imageUrl, name: albumData.name ?? "album-image" });
                        } catch {
                            await addAlbumImage({ url: imageUrl, name: albumData.name ?? "album-image" });
                        }
                    }
                }

                // Update each track
                for (let i = 0; i < tracks.length; i++) {
                    const track = tracks[i] as TrackWithFile;

                    // Set track as uploading
                    setUploadingTracks((prev) => [...prev, track]);
                    setTrackProgress((prev) => ({ ...prev, [track.id]: 0 }));

                    try {
                        // Check if track has an existing ID (update) or needs to be created
                        const isNewTrack = !track.id || track.id.startsWith("temp-");

                        if (isNewTrack && track.file) {
                            // Create new track with audio file
                            const newTrack = await trackUpload.mutateAsync({
                                trackData: {
                                    type: track.type,
                                    title: track.title,
                                    album_id: albumId,
                                    artist_id: userId,
                                    release_date: track.release_date ?? new Date().toISOString(),
                                    links: track.links || [],
                                    genre: track.genre,
                                },
                                audioFile: track.file,
                                onProgress: (percent: number) => {
                                    setTrackProgress((prev) => ({ ...prev, [track.id]: percent }));
                                },
                            });

                            // Insert track credits for new track
                            const credits = trackCreditData[track.id];
                            if (credits && Object.keys(credits).length > 0) {
                                await createTrackCreditMutation.mutateAsync({
                                    track_id: newTrack.id,
                                    artist_id: userId,
                                    performed_by: credits.performed_by || [],
                                    produced_by: credits.produced_by || [],
                                    written_by: credits.written_by || [],
                                    remixed_by: credits.remixed_by || [],
                                });
                            }
                        } else {
                            // Update existing track
                            const trackUpdateData: any = {
                                type: track.type,
                                title: track.title,
                                release_date: track.release_date ?? new Date().toISOString(),
                                links: track.links || [],
                                genre: track.genre,
                            };

                            // If there's a new audio file, upload it
                            if (track.file) {
                                const audioUrl = await uploadFile({
                                    bucket: "track-urls",
                                    file: track.file,
                                    userId: userId,
                                    albumName: albumData.name,
                                    trackName: track.title,
                                    onUploadProgress: (percent: number) => {
                                        setTrackProgress((prev) => ({ ...prev, [track.id]: percent }));
                                    },
                                });

                                if (audioUrl) {
                                    trackUpdateData.url = audioUrl;
                                }
                            }

                            await updateTrackMutation.mutateAsync({
                                id: track.id,
                                updates: trackUpdateData,
                            });

                            // Upsert track credits (create or update)
                            const credits = trackCreditData[track.id];
                            if (credits && Object.keys(credits).length > 0) {
                                // Try to create (will fail if exists), then we know to update
                                try {
                                    await createTrackCreditMutation.mutateAsync({
                                        track_id: track.id,
                                        artist_id: userId,
                                        performed_by: credits.performed_by || [],
                                        produced_by: credits.produced_by || [],
                                        written_by: credits.written_by || [],
                                        remixed_by: credits.remixed_by || [],
                                    });
                                } catch (createError) {
                                    // If create failed, credit likely exists - update it
                                    // Note: You may need to fetch the credit ID first or use a different update approach
                                    console.log("Credit exists, would need to update:", createError);
                                    // This is a limitation - you may need to implement an upsert on the backend
                                }
                            }
                        }

                        // Mark track as finished
                        setTrackProgress((prev) => ({ ...prev, [track.id]: 100 }));
                        setFinishedTracks((prev) => [...prev, track]);
                        setUploadingTracks((prev) => prev.filter((t) => t.id !== track.id));
                    } catch (trackError) {
                        // Mark track as failed and stop upload
                        setUploadingTracks((prev) => prev.filter((t) => t.id !== track.id));
                        setFailedTracks((prev) => [...prev, track]);
                        throw trackError;
                    }
                }
            } else {
                // Handle single track update
                const singleTrack = tracks[0];

                if (!singleTrack) {
                    throw new Error("No track found for single update.");
                }

                // Update single album
                const albumUpdateData = {
                    name: singleTrack.title || "Single",
                    type: "Single" as const,
                    release_date: singleTrack.release_date ?? new Date().toISOString(),
                };

                await updateAlbumMutation.mutateAsync({
                    id: albumId,
                    updates: albumUpdateData,
                });

                // Update album image if provided
                if (albumData.albumImageFile) {
                    const imageUrl = await uploadFile({
                        bucket: "album-covers",
                        file: albumData.albumImageFile,
                        userId: userId,
                    });

                    if (imageUrl) {
                        try {
                            await updateAlbumImage(albumId, { url: imageUrl, name: singleTrack.title ?? "single-image" });
                        } catch {
                            await addAlbumImage({ url: imageUrl, name: singleTrack.title ?? "single-image" });
                        }
                    }
                }

                // Set track as uploading
                setUploadingTracks([singleTrack]);
                setTrackProgress({ [singleTrack.id]: 0 });

                try {
                    const isNewTrack = !singleTrack.id || singleTrack.id.startsWith("temp-");

                    if (isNewTrack && singleTrack.audioFile) {
                        // Create new track
                        const newTrack = await trackUpload.mutateAsync({
                            trackData: {
                                type: singleTrack.type,
                                title: singleTrack.title,
                                album_id: albumId,
                                artist_id: userId,
                                release_date: singleTrack.release_date ?? new Date().toISOString(),
                                links: singleTrack.links || [],
                                genre: singleTrack.genre,
                            },
                            audioFile: singleTrack.audioFile,
                            onProgress: (percent: number) => {
                                setTrackProgress((prev) => ({ ...prev, [singleTrack.id]: percent }));
                            },
                        });

                        // Insert credits
                        const credits = trackCreditData[singleTrack.id];
                        if (credits && Object.keys(credits).length > 0) {
                            await createTrackCreditMutation.mutateAsync({
                                track_id: newTrack.id,
                                artist_id: userId,
                                performed_by: credits.performed_by || [],
                                produced_by: credits.produced_by || [],
                                written_by: credits.written_by || [],
                                remixed_by: credits.remixed_by || [],
                            });
                        }
                    } else {
                        // Update existing track
                        const trackUpdateData: any = {
                            type: singleTrack.type,
                            title: singleTrack.title,
                            release_date: singleTrack.release_date ?? new Date().toISOString(),
                            links: singleTrack.links || [],
                            genre: singleTrack.genre,
                        };

                        // If there's a new audio file, upload it
                        if (singleTrack.audioFile) {
                            const audioUrl = await uploadFile({
                                bucket: "track-urls",
                                file: singleTrack.audioFile,
                                userId: userId,
                                albumName: albumData.name,
                                trackName: singleTrack.title,
                                onUploadProgress: (percent: number) => {
                                    setTrackProgress((prev) => ({ ...prev, [singleTrack.id]: percent }));
                                },
                            });

                            if (audioUrl) {
                                trackUpdateData.url = audioUrl;
                            }
                        }

                        await updateTrackMutation.mutateAsync({
                            id: singleTrack.id,
                            updates: trackUpdateData,
                        });

                        // Upsert credits
                        const credits = trackCreditData[singleTrack.id];
                        if (credits && Object.keys(credits).length > 0) {
                            try {
                                await createTrackCreditMutation.mutateAsync({
                                    track_id: singleTrack.id,
                                    artist_id: userId,
                                    performed_by: credits.performed_by || [],
                                    produced_by: credits.produced_by || [],
                                    written_by: credits.written_by || [],
                                    remixed_by: credits.remixed_by || [],
                                });
                            } catch (createError) {
                                console.log("Credit exists, would need to update:", createError);
                            }
                        }
                    }

                    // Mark as finished
                    setTrackProgress((prev) => ({ ...prev, [singleTrack.id]: 100 }));
                    setFinishedTracks([singleTrack]);
                    setUploadingTracks([]);
                } catch (trackError) {
                    // Mark as failed
                    setUploadingTracks([]);
                    setFailedTracks([singleTrack]);
                    throw trackError;
                }
            }

            // Show success modal
            openModal("success", {
                title: "Update completed",
                onConfirm: () => closeModal(),
            });
        } catch (err) {
            // Clear uploading state on error
            setUploadingTracks([]);

            // Show error modal
            console.error("Update error:", err);
            openModal("error", {
                title: "Update failed",
                errors: [(err as Error).message || "An unknown error occurred during update."],
            });
        }
    };

    const { errors, isUploading, handleSubmit } = useUploadForm(isEditing ? handleUpdateSubmit : handleUploadSubmit);

    return (
        <>
            {/* Upload progress cards */}
            {(uploadingTracks.length > 0 || finishedTracks.length > 0 || failedTracks.length > 0) && (
                <div className="mb-4 space-y-2">
                    {uploadingTracks.map((track) => (
                        <MiniTrackCard
                            key={track.id}
                            track={track}
                            status="uploading"
                            // progress={trackProgress[track.id]}
                        />
                    ))}
                    {finishedTracks.map((track) => (
                        <MiniTrackCard
                            key={track.id}
                            track={track}
                            status="finished"
                            // progress={100}
                        />
                    ))}
                    {failedTracks.map((track) => (
                        <MiniTrackCard key={track.id} track={track} status="failed" />
                    ))}
                </div>
            )}

            {/* Upload form */}
            <form
                onSubmit={handleSubmit}
                className="max-w-2xl mx-auto space-y-6 bg-neutral-950/50 border border-neutral-800 rounded-2xl p-6 shadow-xl"
            >
                {/* Upload mode tabs */}
                {isEditing ? null : <UploadModeTabs selectedType={selectedType} setSelectedType={handleAlbumTypeChange} />}

                {/* Album/track details and track list */}
                <AlbumDetailsForm />
                <TrackListEditor />

                {/* Validation errors */}
                {errors.length > 0 && (
                    <div className="rounded-lg bg-red-500/10 border border-red-600/40 text-red-400 p-3 text-sm">
                        <ul className="list-disc ml-5 space-y-1">
                            {errors.map((err, i) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Submit button */}
                <div className="pt-4">
                    <Button type="submit" disabled={isUploading || !tracks.length} className="w-full">
                        {isUploading ? (isEditing ? "Updating..." : "Uploading...") : isEditing ? "Update" : "Continue to Upload"}
                    </Button>
                </div>
            </form>
        </>
    );
}
