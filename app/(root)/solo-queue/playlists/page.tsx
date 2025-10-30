"use client";

import Link from "next/link";
import { useAllPlaylists } from "@/hooks/music/use-playlists";
import { PlayCircle, Music } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

// Resolve cover strictly from the first track album image using new structure
function getPlaylistCoverUrl(playlist: any): string | undefined {
    // Access the first track's album images through the new structure
    const firstTrack = playlist?.tracks?.[0];
    // Handle both direct track reference and nested track object
    const track = firstTrack?.track || firstTrack;
    return track?.albums?.album_images?.[0]?.url || track?.album?.images?.[0]?.url;
}

// Main page component
export default function PlaylistsPage() {
    const { data, isLoading, isError, refetch } = useAllPlaylists();
    const [playlists, setPlaylists] = useState<any[]>([]);

    // Use effect to update state when data changes
    useEffect(() => {
        if (data) {
            setPlaylists(data);
        }
    }, [data]);

    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Playlists</h1>
                    <p className="text-sm text-neutral-400 mt-1">{playlists.length} total</p>
                </div>
                <Link
                    href="/solo-queue/playlists/create"
                    className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors"
                >
                    Create Playlist
                </Link>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="rounded-xl p-4 border border-neutral-800 bg-neutral-900/50 animate-pulse">
                            <div className="aspect-square rounded-md bg-neutral-800 mb-3" />
                            <div className="h-4 bg-neutral-800 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-neutral-800 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            )}

            {/* Error state */}
            {!isLoading && isError && (
                <div className="flex flex-col items-center justify-center text-center py-16">
                    <p className="text-neutral-300 mb-3">Failed to load playlists.</p>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !isError && playlists.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-16">
                    <div className="w-24 h-24 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4">
                        <Music size={40} className="text-neutral-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-white mb-2">No playlists yet</h2>
                    <p className="text-neutral-400 mb-6">Create your first playlist to get started.</p>
                    <Link
                        href="/solo-queue/playlists/create"
                        className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors"
                    >
                        Create Playlist
                    </Link>
                </div>
            )}

            {/* Grid */}
            {!isLoading && !isError && playlists.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                    {playlists.map((playlist) => {
                        const coverUrl = getPlaylistCoverUrl(playlist);
                        return (
                            <Link
                                key={playlist.id}
                                href={`/solo-queue/playlists/${playlist.id}`}
                                className="group rounded-xl p-4 border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 transition-colors"
                            >
                                <div className="relative aspect-square rounded-md overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-700 flex items-center justify-center">
                                    {coverUrl ? (
                                        <Image
                                            src={coverUrl}
                                            alt={`${playlist.name} cover`}
                                            fill
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                                            className="object-cover"
                                            priority={false}
                                        />
                                    ) : (
                                        <Music size={42} className="text-neutral-400 group-hover:text-white transition-colors" />
                                    )}
                                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="p-2 rounded-full bg-green-600 text-white shadow-lg">
                                            <PlayCircle size={20} />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <h3 className="text-sm font-semibold text-white truncate">{playlist.name}</h3>
                                    <p className="text-xs text-neutral-400 truncate">
                                        {playlist.tracks?.length ? `${playlist.tracks.length} tracks` : "Playlist"}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
