"use client";

import React, { useMemo } from "react";
import TrackCard from "@/components/layout/music/track-card";
import { useAlbumsByArtist } from "@/hooks/music/use-albums";
import { useArtist } from "@/hooks/music/use-artists";
import { useTracksWithRelationsByArtist } from "@/hooks/music/use-tracks";
import { useAuthStore } from "@/stores/auth-store";

/**
 * MyTracksPage
 * Displays tracks uploaded by the currently logged-in artist
 */
export default function MyTracksPage() {
    const { user } = useAuthStore();
    const { data: artist } = useArtist(user?.id || "");
    const { data: tracks, isLoading, error } = useTracksWithRelationsByArtist(artist?.id || "");
    const { data: albums } = useAlbumsByArtist(artist?.id || "", !!artist?.id);

    // All hooks are called before any return!

    // Filter tracks to only include those by current user
    const myTracks = useMemo(() => tracks?.filter((track) => track.artist_id === user?.id) || [], [tracks, user?.id]);

    // Build album map for quick lookup
    const albumMap = useMemo(() => {
        if (!albums?.length) return new Map();
        return new Map(albums.map((album) => [album.id, { ...album, images: album.album_images || [] }]));
    }, [albums]);

    // Compose tracks with album images
    const tracksWithAlbumImages = useMemo(() => {
        if (!myTracks.length) return [];
        return myTracks.map((track) => {
            const album = albumMap.get(track.album_id) || null;
            return {
                ...track,
                album,
            };
        });
    }, [myTracks, albumMap]);

    // Build a playlist shape compatible with TrackWithRelations[]
    const playlist = tracksWithAlbumImages;

    // -------------------------
    // Early return after all hooks
    // -------------------------
    if (!user) return null;

    // ...rest of your component (loading, error, empty, grid)
    // (unchanged from your previous code)
    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-white mb-8">My Tracks</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-gray-800 rounded-2xl h-80 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-white mb-8">My Tracks</h1>
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                    <p className="text-red-400">Error loading tracks: {error.message}</p>
                </div>
            </div>
        );
    }

    if (tracksWithAlbumImages.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8 pt-24 text-center">
                <h1 className="text-3xl font-bold text-white mb-8">My Tracks</h1>
                <p className="text-gray-400 text-lg">No tracks found</p>
                <p className="text-gray-500 text-sm mt-2">Start creating music to see your tracks here</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-8">My Tracks</h1>
            <p className="text-gray-400 mb-6">
                {tracksWithAlbumImages.length} track{tracksWithAlbumImages.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-24">
                {tracksWithAlbumImages.map((track) => (
                    <TrackCard key={track.id} track={track} playlist={playlist} />
                ))}
            </div>
        </div>
    );
}
