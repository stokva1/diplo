"use client";

import {useState} from "react";
import {Download} from "lucide-react";
import {downloadFile} from "@/lib/api";

export function FileDownloadButton({
                                       fileId,
                                       fileName,
                                   }: {
    fileId: string;
    fileName: string;
}) {
    const [isDownloading, setIsDownloading] = useState(false);

    async function handleDownload() {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            return;
        }

        setIsDownloading(true);

        try {
            const blob = await downloadFile(fileId, token);
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();

            window.setTimeout(() => URL.revokeObjectURL(url), 0);
        } finally {
            setIsDownloading(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
            <Download className="size-3.5"/>
            {isDownloading ? "Downloading..." : "Download invoice"}
        </button>
    );
}