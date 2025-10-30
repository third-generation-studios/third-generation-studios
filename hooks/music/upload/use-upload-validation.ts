import { useUploadFormStore } from "@/stores/upload-form-store";
import { useCallback } from "react";

export const useUploadValidation = () => {
    const { albumData, tracks, isEditing } = useUploadFormStore();

    const validate = useCallback(() => {
        const errs: string[] = [];

        if (!tracks.length) errs.push("At least one track is required.");

        // Check for duplicate track titles within this upload
        const titleCounts = new Map<string, number[]>();
        tracks.forEach((t, i) => {
            const normalizedTitle = t.title.trim().toLowerCase();
            if (normalizedTitle) {
                const indices = titleCounts.get(normalizedTitle) || [];
                indices.push(i + 1);
                titleCounts.set(normalizedTitle, indices);
            }
        });

        // Report duplicates
        titleCounts.forEach((indices, title) => {
            if (indices.length > 1) {
                errs.push(`Duplicate track title "${title}" found in tracks: ${indices.join(", ")}`);
            }
        });

        tracks.forEach((t, i) => {
            if (!t.title.trim()) errs.push(`Track ${i + 1}: title is required.`);

            // Only require audio file if not in editing mode (existing tracks already have audio)
            if (!isEditing && !t.audioFile) errs.push(`Track ${i + 1}: audio file is required.`);

            if (!t.genre?.trim()) errs.push(`Track ${i + 1}: genre is required.`);
            if (!t.duration) errs.push(`Track ${i + 1}: duration is required.`);
            if (!t.type || t.type.trim() === "") errs.push(`Track ${i + 1}: track type is required.`);
        });

        // Album Validations
        if (albumData.type === "Album") {
            if (!albumData.name.trim()) errs.push("Album name is required.");

            // Only require album image if not editing (existing albums already have images)
            if (!isEditing && !albumData.albumImageFile) errs.push("Album cover image is required.");
        }

        return errs;
    }, [albumData, tracks, isEditing]);

    return { validate };
};
