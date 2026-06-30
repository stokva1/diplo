"use client";

import {useEffect, useState} from "react";
import {ImageOff} from "lucide-react";
import {downloadFile} from "@/lib/api";

export function IssuePhoto({
                               fileId,
                               fileName,
                           }: {
    fileId: string;
    fileName: string;
}) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem("accessToken");

        if (storedToken === null) {
            setError(true);
            return;
        }

        const accessToken: string = storedToken;

        let objectUrl = "";
        let isDisposed = false;

        async function loadImage() {
            try {
                const blob = await downloadFile(fileId, accessToken);

                if (isDisposed) {
                    return;
                }

                objectUrl = URL.createObjectURL(blob);
                setImageUrl(objectUrl);
            } catch {
                if (!isDisposed) {
                    setError(true);
                }
            }
        }

        loadImage();

        return () => {
            isDisposed = true;

            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [fileId]);

    if (error) {
        return (
            <div className="flex aspect-square items-center justify-center rounded-lg border border-border bg-muted/20 p-3 text-center">
                <div>
                    <ImageOff className="mx-auto size-5 text-muted-foreground"/>
                    <p className="mt-2 truncate text-xs text-muted-foreground">
                        {fileName}
                    </p>
                </div>
            </div>
        );
    }

    if (!imageUrl) {
        return (
            <div className="aspect-square animate-pulse rounded-lg border border-border bg-muted/40"/>
        );
    }

    return (
        <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-lg border border-border bg-muted/20"
            title={fileName}
        >
            <img
                src={imageUrl}
                alt={fileName}
                className="aspect-square w-full object-cover transition-transform hover:scale-105"
            />
        </a>
    );
}