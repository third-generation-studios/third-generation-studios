import { supabase } from "../supabase/client";
import { TrackWithRelations } from "../types/database";
import type { Database } from "../types/supabase-types";

// Use proper Supabase types
type PlaylistRow = Database["public"]["Tables"]["playlists"]["Row"];
type PlaylistTrackRow = Database["public"]["Tables"]["playlist_tracks"]["Row"];
type TrackRow = Database["public"]["Tables"]["tracks"]["Row"];
type ArtistRow = Database["public"]["Tables"]["artists"]["Row"];
type AlbumRow = Database["public"]["Tables"]["albums"]["Row"];
type AlbumImageRow = Database["public"]["Tables"]["album_images"]["Row"];
type TrackCreditRow = Database["public"]["Tables"]["track_credits"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PlaylistLikeRow = Database["public"]["Tables"]["playlist_likes"]["Row"];
type RemixRow = Database["public"]["Tables"]["remixes"]["Row"];

// Raw data types from Supabase (what comes back from the query)
interface RawPlaylistData extends PlaylistRow {
    creator: ProfileRow | null;
    tracks: RawPlaylistTrack[];
    likes: PlaylistLikeRow[];
}

interface RawPlaylistTrack extends PlaylistTrackRow {
    track: RawTrack;
}

interface RawTrack extends TrackRow {
    artists: ArtistRow;
    albums: AlbumRow & {
        album_images: AlbumImageRow[];
    };
    track_credits: TrackCreditRow[];
    remixes: RemixRow | null;
}

// Processed types using Supabase schema
export interface PlaylistWithRelations extends PlaylistRow {
    creator?: {
        id: string;
        username: string | null;
        avatar_url: string | null;
        role: Database["public"]["Enums"]["profile_role"];
        created_at: string;
        updated_at: string;
    };
    tracks: PlaylistTrackWithRelations[];
    likes_count: number;
    is_liked: boolean;
}

export interface PlaylistTrackWithRelations extends PlaylistTrackRow {
    track: TrackWithRelations;
}

// Helper to shape playlist data with proper types
function shapePlaylist(data: RawPlaylistData): PlaylistWithRelations {
    return {
        id: data.id,
        name: data.name,
        description: data.description,
        created_by: data.created_by,
        is_public: data.is_public,
        cover_image_url: data.cover_image_url,
        track_count: data.track_count,
        total_duration: data.total_duration,
        created_at: data.created_at,
        updated_at: data.updated_at,
        creator: data.creator
            ? {
                  id: data.creator.id,
                  username: data.creator.username,
                  avatar_url: data.creator.avatar_url,
                  role: data.creator.role,
                  created_at: data.creator.created_at,
                  updated_at: data.creator.updated_at,
              }
            : undefined,
        tracks: data.tracks.map(
            (t: RawPlaylistTrack): PlaylistTrackWithRelations => ({
                id: t.id,
                playlist_id: t.playlist_id,
                track_id: t.track_id,
                position: t.position,
                added_by: t.added_by,
                added_at: t.added_at,
                track: {
                    id: t.track.id,
                    album_id: t.track.album_id,
                    artist_id: t.track.artist_id,
                    title: t.track.title,
                    url: t.track.url,
                    url_refreshed_at: t.track.url_refreshed_at,
                    duration: t.track.duration,
                    release_date: t.track.release_date,
                    genre: t.track.genre,
                    locked: t.track.locked,
                    plays: t.track.plays,
                    lyrics: t.track.lyrics,
                    links: t.track.links,
                    is_public: t.track.is_public,
                    created_at: t.track.created_at,
                    updated_at: t.track.updated_at,
                    type: t.track.type,
                    artists: {
                        id: t.track.artists.id,
                        stage_name: t.track.artists.stage_name,
                        profile_image_url: t.track.artists.profile_image_url,
                        verified: t.track.artists.verified,
                        created_at: t.track.artists.created_at,
                        updated_at: t.track.artists.updated_at,
                    },
                    albums: {
                        id: t.track.albums.id,
                        name: t.track.albums.name,
                        type: t.track.albums.type,
                        release_date: t.track.albums.release_date,
                        created_at: t.track.albums.created_at,
                        updated_at: t.track.albums.updated_at,
                        album_images: t.track.albums.album_images,
                    },
                    track_credits: t.track.track_credits,
                    remixes: t.track.remixes
                        ? {
                              id: t.track.remixes.id,
                              original_song: t.track.remixes.original_song,
                              original_artists: t.track.remixes.original_artists,
                              url: t.track.remixes.url,
                              created_at: t.track.remixes.created_at,
                              updated_at: t.track.remixes.updated_at,
                          }
                        : null,
                    is_liked: false,
                } as TrackWithRelations,
            }),
        ),
        is_liked: false,
        likes_count: data.likes.length,
    };
}

// Fetch all playlists with creator, tracks, and likes
export async function fetchPlaylistsWithJoins(): Promise<PlaylistWithRelations[]> {
    const { data, error } = await supabase
        .from("playlists")
        .select(
            `
      *,
      creator:profiles!playlists_created_by_fkey(*),
      tracks:playlist_tracks(
        *,
        track:tracks(
          *,
          artists:artists!tracks_artist_id_fkey(*),
          albums:albums!tracks_album_id_fkey(
            *,
            album_images:album_images(*)
          ),
          track_credits:track_credits(*),
          remixes:remixes(*)
        )
      ),
      likes:playlist_likes(*)
    `,
        )
        .order("created_at", { ascending: false });

    if (error) throw error;

    return ((data as RawPlaylistData[]) || []).map(shapePlaylist);
}

// Fetch single playlist by id
export async function fetchPlaylistByIdWithJoins(id: string): Promise<PlaylistWithRelations> {
    const { data, error } = await supabase
        .from("playlists")
        .select(
            `
      *,
      creator:profiles!playlists_created_by_fkey(*),
      tracks:playlist_tracks(
        *,
        track:tracks(
          *,
          artists:artists!tracks_artist_id_fkey(*),
          albums:albums!tracks_album_id_fkey(
            *,
            album_images:album_images(*)
          ),
          track_credits:track_credits(*),
          remixes:remixes(*)
        )
      ),
      likes:playlist_likes(*)
    `,
        )
        .eq("id", id)
        .single();

    if (error) throw error;
    if (!data) throw new Error("Playlist not found");

    return shapePlaylist(data as RawPlaylistData);
}

// Fetch playlists by a specific user
export async function fetchPlaylistsByUser(userId: string): Promise<PlaylistWithRelations[]> {
    const { data, error } = await supabase
        .from("playlists")
        .select(
            `
      *,
      creator:profiles!playlists_created_by_fkey(*),
      tracks:playlist_tracks(
        *,
        track:tracks(
          *,
          artists:artists!tracks_artist_id_fkey(*),
          albums:albums!tracks_album_id_fkey(
            *,
            album_images:album_images(*)
          ),
          track_credits:track_credits(*),
          remixes:remixes(*)
        )
      ),
      likes:playlist_likes(*)
    `,
        )
        .eq("created_by", userId)
        .order("created_at", { ascending: false });

    if (error) throw error;

    return ((data as RawPlaylistData[]) || []).map(shapePlaylist);
}

// Fetch public playlists only
export async function fetchPublicPlaylists(): Promise<PlaylistWithRelations[]> {
    const { data, error } = await supabase
        .from("playlists")
        .select(
            `
      *,
      creator:profiles!playlists_created_by_fkey(*),
      tracks:playlist_tracks(
        *,
        track:tracks(
          *,
          artists:artists!tracks_artist_id_fkey(*),
          albums:albums!tracks_album_id_fkey(
            *,
            album_images:album_images(*)
          ),
          track_credits:track_credits(*),
          remixes:remixes(*)
        )
      ),
      likes:playlist_likes(*)
    `,
        )
        .eq("is_public", true)
        .order("created_at", { ascending: false });

    if (error) throw error;

    return ((data as RawPlaylistData[]) || []).map(shapePlaylist);
}

// Create a new playlist
export async function createPlaylist(playlist: Database["public"]["Tables"]["playlists"]["Insert"]): Promise<PlaylistRow> {
    const { data, error } = await supabase.from("playlists").insert(playlist).select().single();

    if (error) throw error;
    if (!data) throw new Error("Failed to create playlist");

    return data;
}

// Update an existing playlist
export async function updatePlaylist(id: string, updates: Database["public"]["Tables"]["playlists"]["Update"]): Promise<PlaylistRow> {
    const { data, error } = await supabase.from("playlists").update(updates).eq("id", id).select().single();

    if (error) throw error;
    if (!data) throw new Error("Failed to update playlist");

    return data;
}

// Delete a playlist
export async function deletePlaylist(id: string): Promise<void> {
    const { error } = await supabase.from("playlists").delete().eq("id", id);

    if (error) throw error;
}

// Add track to playlist
export async function addTrackToPlaylist(
    playlistTrack: Database["public"]["Tables"]["playlist_tracks"]["Insert"],
): Promise<PlaylistTrackRow> {
    const { data, error } = await supabase.from("playlist_tracks").insert(playlistTrack).select().single();

    if (error) throw error;
    if (!data) throw new Error("Failed to add track to playlist");

    return data;
}

// Remove track from playlist
export async function removeTrackFromPlaylist(playlistTrackId: string): Promise<void> {
    const { error } = await supabase.from("playlist_tracks").delete().eq("id", playlistTrackId);

    if (error) throw error;
}
