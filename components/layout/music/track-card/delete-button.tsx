import { useDeleteAlbum } from "@/hooks/music/use-albums";
import { useDeleteTrack } from "@/hooks/music/use-tracks";
import { TrackWithRelations } from "@/lib/types/database";
import { useModalStore } from "@/stores/modal-store";
import { Trash2 } from "lucide-react";
import React from "react";

const DeleteButton = ({ track }: { track: TrackWithRelations }) => {
    const openModal = useModalStore((state) => state.openModal);
    const closeModal = useModalStore((state) => state.closeModal);
    const deleteAlbum = useDeleteAlbum();
    const deleteTrack = useDeleteTrack();

    const handleDeleteClick = () => {
        const isSingleOrRemix = track.album?.type === "Single" || track.album?.type === "Remix";
        const deleteMessage = isSingleOrRemix ? `Delete "${track.title}" and its album?` : `Delete "${track.title}"?`;

        openModal("confirm", {
            title: deleteMessage,
            confirmText: "Delete",
            cancelText: "Cancel",
            onConfirm: async () => {
                try {
                    // Delete track first
                    await deleteTrack.mutateAsync(track.id);

                    // If it's a single or remix, delete the album too
                    if (isSingleOrRemix && track.album_id) {
                        await deleteAlbum.mutateAsync(track.album_id);
                    }

                    closeModal();
                    openModal("success", {
                        title: "Track Deleted",
                        confirmText: "Continue",
                        cancelText: "Close",
                        onConfirm: () => closeModal(),
                    });
                } catch (error) {
                    console.error("Failed to delete track:", error);
                    openModal("error", {
                        title: "Error",
                        errors: ["Failed to delete track. Please try again."],
                    });
                }
            },
        });
    };

    return (
        <button
            onClick={handleDeleteClick}
            className="absolute bottom-[20px] right-4 p-[7px] bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg"
            title="Delete track"
        >
            <Trash2 className="h-4 w-4" />
        </button>
    );
};

export default DeleteButton;
