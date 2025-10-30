"use client";

import Image from "next/image";
import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import PlayPauseButton from "./play-pause-button";
import TrackInfo from "./track-info";
import LockButton from "./lock-button";
import TypeLabel from "./type-label";
import LikeButton from "../../../ui/buttons/like-button";
import { useAuthStore } from "@/stores/auth-store";
import AddToPlaylistButton from "../../../ui/buttons/add-to-playlist/playlist-button";
import RemixCard from "./remix-card";
import { TrackWithRelations } from "@/lib/types/database";
import DeleteButton from "./delete-button";
import ExternalLinkButton from "../external-link-button";

interface ITrackCardProps {
    track: TrackWithRelations;
    playlist?: TrackWithRelations[];
    onUnlock?: (trackId: string) => void;
}

const TrackCard = ({ track, playlist = [], onUnlock }: ITrackCardProps) => {
    const { user } = useAuthStore();
    const pathname = usePathname();

    // Compute album cover safely - moved outside the conditional
    const albumCover = useMemo(() => {
        const albumImages = track.album?.images ?? [];
        if (!albumImages.length) return "/earth-splash.jpg";
        const match = albumImages.find((img) => img.album_id === track.album_id);
        return match?.url || albumImages[0]?.url || "/earth-splash.jpg";
    }, [track]);

    // If this is a remix, delegate to RemixCard and pass only the track
    if (track.type === "Remix" && track.remixes && track.remixes.length > 0) {
        // Pass the first remix relation (or adjust as needed)
        return <RemixCard track={track} remixData={track.remixes[0]} onUnlock={onUnlock} />;
    }

    return (
        <div className="group bg-gray-900/80 rounded-2xl shadow-lg overflow-hidden hover:scale-105 hover:shadow-2xl transition-all duration-300 relative flex flex-col">
            {/* Album Image */}
            <div className="relative h-48 w-full">
                <Image
                    src={albumCover}
                    alt={track.title || "Track Cover"}
                    fill
                    className={`object-cover group-hover:brightness-90 transition ${track.locked ? "blur-sm" : ""}`}
                    sizes="(max-width: 768px) 100vw, 33vw"
                />

                {/* Overlays */}
                <div className="absolute top-2 left-2">
                    <LikeButton trackId={track.id} />
                </div>
                <TypeLabel type={track.type || "Unknown"} />
                {track.locked && <LockButton onUnlock={onUnlock} trackId={track.id} />}
            </div>

            {/* Track Info + Actions */}
            <div className="p-5 flex-1 flex flex-col justify-between">
                <TrackInfo track={track} />

                {!track.url && (
                    <p className="mt-2 text-xs text-red-400 text-center">Preview not available — use links below for full track</p>
                )}

                <PlayPauseButton track={track} playlist={playlist} locked={track.locked} />

                {/* Artist-only update button */}
                {/* {profile?.role === "artist" && (
                    <button
                        onClick={() => router.push(`/solo-queue/studio/my-tracks/update/${track.id}`)}
                        className="mt-3 w-full bg-yellow-400 hover:bg-yellow-600 text-black font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                        </svg>
                        Update Track
                    </button>
                )} */}

                {/* Add to Playlist Button */}
                {user && (
                    <div className="mt-4">
                        <AddToPlaylistButton trackId={track.id} />
                    </div>
                )}
                {user && user.id === track.artist_id && pathname === "/solo-queue/studio/my-tracks" && <DeleteButton track={track} />}

                {/* External Links */}
                {/* {track.album?.type === "Remix" && (
                    <ExternalLinkButton
                        albumName={track.album.name}
                        link={track.album.}
                    />
                )} */}
            </div>
        </div>
    );
};

export default TrackCard;
