"use client";

import {useId, useState} from "react";
import {ImagePlus, X} from "lucide-react";

export function PhotoPicker({
                                files,
                                onChange,
                                disabled = false,
                            }: {
    files: File[];
    onChange: (files: File[]) => void;
    disabled?: boolean;
}) {
    const inputId = useId();

    const [isDragging, setIsDragging] = useState(false);

    function addFiles(selectedFiles: File[]) {
        const newFiles = selectedFiles.filter(
            (file) =>
                !files.some(
                    (currentFile) =>
                        currentFile.name === file.name &&
                        currentFile.size === file.size &&
                        currentFile.lastModified === file.lastModified,
                ),
        );

        onChange([...files, ...newFiles]);
    }

    function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
        addFiles(Array.from(event.target.files ?? []));
        event.target.value = "";
    }

    function removeFile(fileToRemove: File) {
        onChange(files.filter((file) => file !== fileToRemove));
    }

    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-card-foreground">
                    Photos
                </p>

                <p className="text-xs text-muted-foreground">
                    Optional
                </p>
            </div>

            <label
                htmlFor={inputId}
                onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                }}
                onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);

                    addFiles(Array.from(event.dataTransfer.files));
                }}
                className={`flex h-32 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 text-sm font-medium transition-colors ${
                    isDragging
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-muted/20 text-muted-foreground hover:border-ring/50 hover:bg-muted/40 hover:text-foreground"
                }`}
            >
                <ImagePlus className="size-5"/>
                {isDragging ? "Drop photos here" : "Add photos or drag them here"}
            </label>

            <input
                id={inputId}
                type="file"
                accept="image/*"
                multiple
                disabled={disabled}
                onChange={handleFilesSelected}
                className="hidden"
            />

            {files.length > 0 ? (
                <div className="mt-3 space-y-1">
                    {files.map((file) => (
                        <div
                            key={`${file.name}-${file.lastModified}`}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                        >
                            <p className="min-w-0 truncate text-sm text-card-foreground">
                                {file.name}
                            </p>

                            <button
                                type="button"
                                onClick={() => removeFile(file)}
                                disabled={disabled}
                                className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={`Remove ${file.name}`}
                            >
                                <X className="size-4"/>
                            </button>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}