import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import {
    fetchAllAlbums,
    fetchAlbumById,
    fetchAlbumWithImages,
    fetchAlbumWithRelations,
    fetchAlbumsByArtist,
    fetchAlbumsWithImages,
    fetchAlbumsByType,
    fetchRecentAlbums,
    searchAlbums,
    fetchAlbumsByYear,
    fetchPopularAlbums,
    fetchAlbumStats,
    fetchAlbumsWithoutImages,
    createAlbum,
    updateAlbum,
    createAlbumWithImages,
    addAlbumImage,
    updateAlbumImage,
    deleteAlbumImage,
    fetchAlbumImages,
    type Album,
    type AlbumInsert,
    type AlbumUpdate,
    type AlbumImage,
    type AlbumImageInsert,
} from "@/lib/fetchers/album-fetchers";
import { uploadFile } from "@/lib/supabase/storage";
import { supabase } from "@/lib/supabase/client";

// Types
export type { Album, AlbumInsert, AlbumUpdate, AlbumImage, AlbumImageInsert };

// Query Keys
export const albumKeys = {
    all: ["albums"] as const,
    lists: () => [...albumKeys.all, "list"] as const,
    list: (filters: string) => [...albumKeys.lists(), { filters }] as const,
    details: () => [...albumKeys.all, "detail"] as const,
    detail: (id: string) => [...albumKeys.details(), id] as const,
    withImages: (id: string) => [...albumKeys.detail(id), "images"] as const,
    withRelations: (id: string) => [...albumKeys.detail(id), "relations"] as const,
    byArtist: (artistId: string) => [...albumKeys.all, "artist", artistId] as const,
    byType: (type: Album["type"]) => [...albumKeys.all, "type", type] as const,
    byYear: (year: number) => [...albumKeys.all, "year", year] as const,
    recent: (limit: number) => [...albumKeys.all, "recent", limit] as const,
    popular: (limit: number) => [...albumKeys.all, "popular", limit] as const,
    search: (query: string) => [...albumKeys.all, "search", query] as const,
    stats: (id: string) => [...albumKeys.detail(id), "stats"] as const,
    withoutImages: () => [...albumKeys.all, "without-images"] as const,
    images: {
        all: (albumId: string) => [...albumKeys.detail(albumId), "album-images"] as const,
        detail: (imageId: string) => ["album-images", imageId] as const,
    },
};

// Basic Query Hooks
export function useAllAlbums() {
    return useQuery({
        queryKey: albumKeys.lists(),
        queryFn: () => fetchAllAlbums(),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

export function useAlbum(id: string, enabled = true) {
    return useQuery({
        queryKey: albumKeys.detail(id),
        queryFn: () => fetchAlbumById(id),
        enabled: !!id && enabled,
        staleTime: 15 * 60 * 1000, // 15 minutes
    });
}

export function useAlbumWithImages(id: string, enabled = true) {
    return useQuery({
        queryKey: albumKeys.withImages(id),
        queryFn: () => fetchAlbumWithImages(id),
        enabled: !!id && enabled,
        staleTime: 15 * 60 * 1000,
    });
}

export function useAlbumWithRelations(id: string, enabled = true) {
    return useQuery({
        queryKey: albumKeys.withRelations(id),
        queryFn: () => fetchAlbumWithRelations(id),
        enabled: !!id && enabled,
        staleTime: 15 * 60 * 1000,
    });
}

export function useAlbumsWithImages() {
    return useQuery({
        queryKey: [...albumKeys.lists(), "with-images"],
        queryFn: () => fetchAlbumsWithImages(),
        staleTime: 10 * 60 * 1000,
    });
}

// Artist Albums
export function useAlbumsByArtist(artistId: string, enabled = true) {
    return useQuery({
        queryKey: albumKeys.byArtist(artistId),
        queryFn: () => fetchAlbumsByArtist(artistId),
        enabled: !!artistId && enabled,
        staleTime: 10 * 60 * 1000,
    });
}

// Albums by Type
export function useAlbumsByType(type: Album["type"]) {
    return useQuery({
        queryKey: albumKeys.byType(type),
        queryFn: () => fetchAlbumsByType(type),
        staleTime: 10 * 60 * 1000,
    });
}

// Recent Albums
export function useRecentAlbums(limit = 10) {
    return useQuery({
        queryKey: albumKeys.recent(limit),
        queryFn: () => fetchRecentAlbums(limit),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useAlbumsByIds(ids: string[], enabled = true) {
    return useQueries({
        queries: ids.map((id) => ({
            queryKey: ["album", id],
            queryFn: () => fetchAlbumById(id),
            enabled: !!id && enabled,
            staleTime: 10 * 60 * 1000,
        })),
    });
}

// Popular Albums
export function usePopularAlbums(limit = 10) {
    return useQuery({
        queryKey: albumKeys.popular(limit),
        queryFn: () => fetchPopularAlbums(limit),
        staleTime: 10 * 60 * 1000,
    });
}

// Albums by Year
export function useAlbumsByYear(year: number) {
    return useQuery({
        queryKey: albumKeys.byYear(year),
        queryFn: () => fetchAlbumsByYear(year),
        staleTime: 15 * 60 * 1000,
    });
}

// Search Albums
export function useSearchAlbums(query: string, enabled = true) {
    const trimmedQuery = query.trim();

    return useQuery({
        queryKey: albumKeys.search(trimmedQuery),
        queryFn: () => searchAlbums(trimmedQuery),
        enabled: !!trimmedQuery && trimmedQuery.length >= 2 && enabled,
        staleTime: 30 * 1000, // 30 seconds for search
    });
}

// Album Stats
export function useAlbumStats(id: string, enabled = true) {
    return useQuery({
        queryKey: albumKeys.stats(id),
        queryFn: () => fetchAlbumStats(id),
        enabled: !!id && enabled,
        staleTime: 5 * 60 * 1000,
    });
}

// Albums without images
export function useAlbumsWithoutImages() {
    return useQuery({
        queryKey: albumKeys.withoutImages(),
        queryFn: () => fetchAlbumsWithoutImages(),
        staleTime: 5 * 60 * 1000,
    });
}

// Album Image Hooks
export function useAlbumImages(albumId: string, enabled = true) {
    return useQuery({
        queryKey: albumKeys.images.all(albumId),
        queryFn: () => fetchAlbumImages(albumId),
        enabled: !!albumId && enabled,
        staleTime: 15 * 60 * 1000,
    });
}

// Mutation Hooks for Albums
export function useCreateAlbum() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (album: AlbumInsert) => createAlbum(album),
        onSuccess: (newAlbum) => {
            // Set the new album in cache
            queryClient.setQueryData(albumKeys.detail(newAlbum.id), newAlbum);

            // Invalidate album lists
            queryClient.invalidateQueries({ queryKey: albumKeys.lists() });
            queryClient.invalidateQueries({ queryKey: albumKeys.byArtist(newAlbum.artist_id) });
            queryClient.invalidateQueries({ queryKey: albumKeys.byType(newAlbum.type) });
            queryClient.invalidateQueries({ queryKey: albumKeys.recent(10) });
        },
    });
}

export function useCreateAlbumWithImages() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ albumData, images }: { albumData: AlbumInsert; images: { name?: string; file: File }[] }) => {
            // Upload all image files to Supabase storage and get URLs
            const uploadedImages: Omit<AlbumImageInsert, "album_id">[] = await Promise.all(
                images.map(async (img) => {
                    const url = await uploadFile({
                        bucket: "album-covers",
                        file: img.file,
                        userId: albumData.artist_id,
                    });

                    if (!url) throw new Error("Failed to upload album image");

                    return {
                        name: img.name || img.file.name,
                        url: url,
                    };
                }),
            );
            return createAlbumWithImages(albumData, uploadedImages);
        },
        onSuccess: (newAlbum) => {
            // Set the new album with images in cache
            queryClient.setQueryData(albumKeys.withImages(newAlbum.id), newAlbum);
            queryClient.setQueryData(albumKeys.detail(newAlbum.id), newAlbum);

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: albumKeys.lists() });
            queryClient.invalidateQueries({ queryKey: albumKeys.byArtist(newAlbum.artist_id) });
            queryClient.invalidateQueries({ queryKey: albumKeys.withoutImages() });
        },
    });
}

export function useUpdateAlbum() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: AlbumUpdate }) => updateAlbum(id, updates),
        onSuccess: (updatedAlbum) => {
            // Update album in cache
            queryClient.setQueryData(albumKeys.detail(updatedAlbum.id), updatedAlbum);

            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: albumKeys.lists() });
            queryClient.invalidateQueries({ queryKey: albumKeys.byArtist(updatedAlbum.artist_id) });
            queryClient.invalidateQueries({ queryKey: albumKeys.byType(updatedAlbum.type) });
            queryClient.invalidateQueries({ queryKey: albumKeys.withImages(updatedAlbum.id) });
            queryClient.invalidateQueries({ queryKey: albumKeys.withRelations(updatedAlbum.id) });
        },
    });
}

export function useDeleteAlbum() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (albumId: string) => {
            const { error } = await supabase.from("albums").delete().eq("id", albumId);

            if (error) throw error;
            return albumId;
        },
        onSuccess: (deletedAlbumId) => {
            // Invalidate all album queries
            queryClient.invalidateQueries({ queryKey: albumKeys.all });
            queryClient.invalidateQueries({ queryKey: albumKeys.detail(deletedAlbumId) });
            // Remove from cache
            queryClient.removeQueries({ queryKey: albumKeys.detail(deletedAlbumId) });
        },
        onError: (error) => {
            console.error("Failed to delete album:", error);
            throw error;
        },
    });
}

// Mutation Hooks for Album Images
export function useAddAlbumImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ albumId, imageData }: { albumId: string; imageData: Omit<AlbumImageInsert, "album_id"> }) =>
            addAlbumImage(albumId, imageData),
        onSuccess: (newImage, { albumId }) => {
            // Invalidate album images
            queryClient.invalidateQueries({ queryKey: albumKeys.images.all(albumId) });
            queryClient.invalidateQueries({ queryKey: albumKeys.withImages(albumId) });
            queryClient.invalidateQueries({ queryKey: albumKeys.withRelations(albumId) });
            queryClient.invalidateQueries({ queryKey: albumKeys.withoutImages() });
        },
    });
}

export function useUpdateAlbumImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            imageId,
            updates,
            albumId,
        }: {
            imageId: string;
            updates: Partial<Omit<AlbumImageInsert, "album_id">>;
            albumId: string;
        }) => updateAlbumImage(imageId, updates),
        onSuccess: (_, { albumId }) => {
            // Invalidate album images
            queryClient.invalidateQueries({ queryKey: albumKeys.images.all(albumId) });
            queryClient.invalidateQueries({ queryKey: albumKeys.withImages(albumId) });
            queryClient.invalidateQueries({ queryKey: albumKeys.withRelations(albumId) });
        },
    });
}

export function useDeleteAlbumImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ imageId, albumId }: { imageId: string; albumId: string }) => deleteAlbumImage(imageId),
        onSuccess: (_, { albumId }) => {
            // Invalidate album images
            queryClient.invalidateQueries({ queryKey: albumKeys.images.all(albumId) });
            queryClient.invalidateQueries({ queryKey: albumKeys.withImages(albumId) });
            queryClient.invalidateQueries({ queryKey: albumKeys.withRelations(albumId) });
            queryClient.invalidateQueries({ queryKey: albumKeys.withoutImages() });
        },
    });
}

// Utility Hooks
export function useAlbumManagement(albumId: string) {
    const album = useAlbumWithRelations(albumId);
    const updateAlbum = useUpdateAlbum();
    const deleteAlbum = useDeleteAlbum();

    return {
        album: album.data,
        isLoading: album.isLoading,
        isError: album.isError,
        error: album.error,
        updateAlbum: (updates: AlbumUpdate) => updateAlbum.mutate({ id: albumId, updates }),
        deleteAlbum: () => deleteAlbum.mutate(albumId),
        isUpdating: updateAlbum.isPending || deleteAlbum.isPending,
    };
}

export function useAlbumImageManagement(albumId: string) {
    const images = useAlbumImages(albumId);
    const addImage = useAddAlbumImage();
    const updateImage = useUpdateAlbumImage();
    const deleteImage = useDeleteAlbumImage();

    return {
        images: images.data,
        isLoading: images.isLoading,
        isError: images.isError,
        error: images.error,
        addImage: (imageData: Omit<AlbumImageInsert, "album_id">) => addImage.mutate({ albumId, imageData }),
        updateImage: (imageId: string, updates: Partial<Omit<AlbumImageInsert, "album_id">>) =>
            updateImage.mutate({ imageId, updates, albumId }),
        deleteImage: (imageId: string) => deleteImage.mutate({ imageId, albumId }),
        isMutating: addImage.isPending || updateImage.isPending || deleteImage.isPending,
    };
}

// Type-specific hooks
export function useSingles() {
    return useAlbumsByType("Single");
}

export function useRemixes() {
    return useAlbumsByType("Remix");
}

export function useFullAlbums() {
    return useAlbumsByType("Album");
}

// Current year albums
export function useCurrentYearAlbums() {
    const currentYear = new Date().getFullYear();
    return useAlbumsByYear(currentYear);
}

// Legacy compatibility hooks (if needed)
export function useAlbumsQuery() {
    return useAllAlbums();
}

export function useAlbumByIdQuery(id: string) {
    return useAlbum(id);
}

export function useAlbumInsert() {
    return useCreateAlbum();
}

export function useAlbumUpdate() {
    const mutation = useUpdateAlbum();

    return {
        ...mutation,
        mutate: ({ id, values }: { id: string; values: AlbumUpdate }) => mutation.mutate({ id, updates: values }),
        mutateAsync: ({ id, values }: { id: string; values: AlbumUpdate }) => mutation.mutateAsync({ id, updates: values }),
    };
}

export function useAlbumDelete() {
    return useDeleteAlbum();
}
