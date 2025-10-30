"use client";

import React from "react";
import { useUploadFormStore } from "@/stores/upload-form-store";
import { AlbumType, UploadMode } from "@/lib/types/database";

export default function UploadModeTabs({
    selectedType,
    setSelectedType,
}: {
    selectedType: AlbumType;
    setSelectedType: (type: AlbumType) => void;
}) {
    const { albumData } = useUploadFormStore();

    // Track selected tab independently from albumData.type

    const handleAlbumTypeChange = (type: AlbumType) => {
        setSelectedType(type);
    };

    return (
        <div className="w-full">
            <div className="grid grid-cols-3 bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden text-sm font-medium">
                {[
                    { label: "Single(s)", value: "Single" },
                    { label: "Album", value: "Album" },
                    { label: "Remix(s)", value: "Remix" },
                ].map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => handleAlbumTypeChange(tab.value as "Album" | "Single" | "Remix")}
                        className={`py-2.5 transition-colors duration-200 ${
                            selectedType === tab.value
                                ? "bg-neutral-800 text-white"
                                : "text-neutral-400 hover:text-white hover:bg-neutral-800/40"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
