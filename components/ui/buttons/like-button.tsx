import { Heart } from "lucide-react";
import React from "react";
import { useToggleTrackLike, useUserTrackLike } from "@/hooks/music/use-tracks";
import { useAuthStore } from "@/stores/auth-store";
import { redirect } from "next/navigation";

interface ILikeButtonProps {
    trackId: string;
    className?: string; // Allow custom styling from parent
    iconSize?: number; // Allow custom icon size
}

const LikeButton: React.FC<ILikeButtonProps> = ({ trackId, className = "", iconSize = 20 }) => {
    const { user } = useAuthStore();
    const userId = user?.id;

    // Fetch current liked state for the track
    const { data: userLike, isLoading: isFetching } = useUserTrackLike(trackId, userId || "", !!userId);

    // Use the toggle like hook for mutations
    const { isLiked, toggleLike, isLoading: isMutating } = useToggleTrackLike(trackId, userId || "");

    const isLoading = isFetching || isMutating;
    const liked = isLiked || !!userLike;

    const handleToggleLike = React.useCallback(async () => {
        if (!userId) {
            // Optional: Show login prompt or redirect to login
            console.warn("User must be logged in to like tracks");
            return redirect("/sign-in");
        }
        if (isLoading) return;
        try {
            toggleLike();
        } catch (error) {
            console.error("Failed to toggle like:", error);
        }
    }, [userId, isLoading, toggleLike]);

    // Show disabled state for unauthenticated users
    if (!userId) {
        return (
            <button
                type="button"
                aria-label="Login to like"
                className={`text-2xl focus:outline-none opacity-60 cursor-no-drop ${className}`}
                title="Login to like tracks"
                disabled
            >
                <Heart size={iconSize} className="text-white/60" fill="none" strokeWidth={2.2} />
            </button>
        );
    }

    return (
        <button
            type="button"
            aria-label={liked ? "Unlike track" : "Like track"}
            onClick={handleToggleLike}
            className={`text-2xl focus:outline-none disabled:opacity-60 transition-transform hover:scale-110 active:scale-95 ${className}`}
            title={liked ? "Unlike track" : "Like track"}
            disabled={isLoading}
        >
            <Heart
                size={iconSize}
                className={`transition-colors duration-200 ${liked ? "text-red-500 fill-red-500" : "text-white/80 hover:text-red-400"}`}
                fill={liked ? "currentColor" : "none"}
                strokeWidth={2.2}
            />
            {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                </span>
            )}
        </button>
    );
};

export default LikeButton;
