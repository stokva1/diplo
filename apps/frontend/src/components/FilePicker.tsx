"use client";

import {useId, useState} from "react";
import {FileText, Upload, X} from "lucide-react";

export function FilePicker({
                               file,
                               onChange,
                               disabled = false,
                           }: {
    file: File | null;
    onChange: (file: File | null) => void;
    disabled?: boolean;
}) {
    const inputId = useId();

    const [isDragging, setIsDragging] = useState(false);

    function addFile(selectedFile: File | null) {
        if (selectedFile) {
            onChange(selectedFile);
        }
    }

    function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
        addFile(event.target.files?.[0] ?? null);
        event.target.value = "";
    }

    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-card-foreground">
                    Invoice or receipt
                </p>

                <p className="text-xs text-muted-foreground">
                    Optional
                </p>
            </div>

            {file ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                            <FileText className="size-4 text-muted-foreground"/>
                        </div>

                        <p className="truncate text-sm text-card-foreground">
                            {file.name}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        disabled={disabled}
                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Remove ${file.name}`}
                    >
                        <X className="size-4"/>
                    </button>
                </div>
            ) : (
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

                        addFile(event.dataTransfer.files[0] ?? null);
                    }}
                    className={`flex h-32 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 text-sm font-medium transition-colors ${
                        isDragging
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-muted/20 text-muted-foreground hover:border-ring/50 hover:bg-muted/40 hover:text-foreground"
                    }`}
                >
                    <Upload className="size-5"/>
                    {isDragging ? "Drop file here" : "Add invoice or receipt, or drag it here"}
                </label>
            )}

            <input
                id={inputId}
                type="file"
                accept="application/pdf,image/*"
                disabled={disabled}
                onChange={handleFileSelected}
                className="hidden"
            />
        </div>
    );
}