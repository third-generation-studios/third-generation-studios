"use client";

import React from "react";
import { useUploadFormStore } from "@/stores/upload-form-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/buttons/button";
import GenreAutocomplete from "./genre-autocomplete";
import UploadAlbumImage from "./upload-album-image";
import TrackFileUpload from "./track-file-upload";
import TrackTypeDropdown from "./track-type-dropdown";

export default function TrackListEditor() {
    const { tracks, setTracks, updateTrack, albumData, setAlbumData, setTrackCreditData, trackCreditData, isEditing } =
        useUploadFormStore();

    const addTrack = () => {
        const newTrack = {
            id: uuidv4(),
            title: "",
            type: "Unreleased" as "Unreleased" | "Remix",
            genre: "",
            duration: 0,
            release_date: new Date().toISOString().split("T")[0],
            lyrics: "",
            is_public: false,
            locked: false,
            plays: 0,
            url: "",
            url_refreshed_at: null,
            links: [],
            album_id: "",
            artist_id: "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setTracks([...tracks, newTrack]);
    };

    const handleTitleChange = (trackId: string, value: string) => {
        updateTrack(trackId, { title: value });
        // Auto-set album name for single/remix mode
        if (albumData.type !== "Album" && tracks.length === 1) {
            setAlbumData({ name: value });
        }
    };

    const removeTrack = (id: string) => setTracks(tracks.filter((t) => t.id !== id));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">Tracks</h3>
                {/* Only show Add Track button when not editing */}
                {!isEditing && (
                    <Button variant="secondary" size="sm" onClick={addTrack} className="flex items-center">
                        <Plus className="w-4 h-4 mr-1" /> Add Track
                    </Button>
                )}
            </div>

            {tracks.length === 0 && <p className="text-sm text-muted-foreground">No tracks added yet.</p>}

            <div className="space-y-4">
                {tracks.map((track, i) => (
                    <div key={track.id} className="flex flex-col gap-4 p-4 bg-muted/30 rounded-lg border border-neutral-700">
                        {/* Image */}
                        {albumData.type !== "Album" && (
                            <UploadAlbumImage
                                onFileSelect={(file) =>
                                    setAlbumData({
                                        ...albumData,
                                        albumImageFile: file!,
                                        albumImageFileName: file ? file.name : "",
                                    })
                                }
                            />
                        )}
                        {/* Track File Upload */}
                        <TrackFileUpload track={track} />

                        {/* Title */}
                        <div className="flex flex-col">
                            <label className="text-xs font-medium mb-1">Title</label>
                            <Input
                                value={track.title}
                                onChange={(e) => handleTitleChange(track.id, e.target.value)}
                                placeholder={`Track ${i + 1} title`}
                                className="w-full"
                            />
                        </div>

                        {/* Genre */}
                        <div className="flex flex-col">
                            <label className="text-xs font-medium mb-1">Genre</label>
                            <GenreAutocomplete
                                id={`genre-input-${track.id}`}
                                value={track.genre || ""}
                                onChange={(val) => updateTrack(track.id, { genre: val })}
                            />
                        </div>

                        {/* Track Type */}
                        <div className="flex flex-col">
                            <label className="text-xs font-medium mb-1">Track Type</label>
                            <TrackTypeDropdown
                                trackId={track.id}
                                value={track.type! || ""}
                                onChange={(val) => updateTrack(track.id, { type: val })}
                            />
                        </div>

                        {/* Track Credits */}
                        <div className="flex flex-col col-span-1 md:col-span-2 gap-2">
                            <label className="text-sm font-medium mb-1">Track Credits</label>

                            {/* Performed By */}
                            <Input
                                type="text"
                                placeholder="Performed By"
                                value={trackCreditData[track.id]?.performed_by?.[0] || ""}
                                onChange={(e) =>
                                    setTrackCreditData({
                                        ...trackCreditData,
                                        [track.id]: { ...trackCreditData[track.id], performed_by: [e.target.value] },
                                    })
                                }
                            />

                            {/* Produced By */}
                            <Input
                                type="text"
                                placeholder="Produced By"
                                value={trackCreditData[track.id]?.produced_by?.[0] || ""}
                                onChange={(e) =>
                                    setTrackCreditData({
                                        ...trackCreditData,
                                        [track.id]: { ...trackCreditData[track.id], produced_by: [e.target.value] },
                                    })
                                }
                            />

                            {/* Written By */}
                            <Input
                                type="text"
                                placeholder="Written By"
                                value={trackCreditData[track.id]?.written_by?.[0] || ""}
                                onChange={(e) =>
                                    setTrackCreditData({
                                        ...trackCreditData,
                                        [track.id]: { ...trackCreditData[track.id], written_by: [e.target.value] },
                                    })
                                }
                            />
                            {/* Spotify URL */}
                            {/* <Input
                                type="text"
                                placeholder="Spotify URL"
                                value={track.links!.url}
                                onChange={(e) =>
                                    setTracks(
                                        tracks.map((t) =>
                                            t.id === track.id ? { ...t, links: { platform: "Spotify", url: e.target.value } } : t,
                                        ),
                                    )
                                }
                            /> */}
                        </div>

                        <div className="flex flex-col w-full col-span-1 md:col-span-2">
                            {/* Lyrics */}
                            <div className="flex flex-col w-full col-span-1">
                                <label className="text-xs font-medium mb-1">Lyrics</label>
                                <Textarea
                                    value={track.lyrics!}
                                    onChange={(e) => updateTrack(track.id, { lyrics: e.target.value })}
                                    placeholder="Lyrics"
                                    className="w-full max-h-28 mb-4"
                                    rows={2}
                                />
                            </div>

                            {/* Switches */}
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={track.is_public!}
                                        onCheckedChange={(val) => updateTrack(track.id, { is_public: val })}
                                    />
                                    <span className="text-xs font-medium">Public</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch checked={track.locked} onCheckedChange={(val) => updateTrack(track.id, { locked: val })} />
                                    <span className="text-xs font-medium">Locked</span>
                                </div>
                            </div>
                        </div>

                        {/* Remix URL */}
                        {track.type === "Remix" && (
                            <div className="flex flex-col col-span-1 md:col-span-2">
                                <label className="text-xs font-medium mb-1">Remix Source URL</label>
                                <Input
                                    value={track.url}
                                    onChange={(e) => updateTrack(track.id, { url: e.target.value })}
                                    placeholder="Remix Source URL"
                                    className="w-full"
                                />
                            </div>
                        )}

                        {/* Remove Track - only show when not editing */}
                        {!isEditing && (
                            <div className="flex justify-end md:col-span-2">
                                <Button variant="ghost" size="icon" onClick={() => removeTrack(track.id)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
