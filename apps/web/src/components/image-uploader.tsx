"use client";

import { useRef, useState } from "react";

type Props = {
  images: string[];
  onChange: (images: string[]) => void;
};

export function ImageUploader({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/uploads", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Échec de l'upload");
        }
        uploaded.push(data.url);
      }
      onChange([...images, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div
            key={url}
            className="group relative h-24 w-24 overflow-hidden rounded-lg border border-border"
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((u) => u !== url))}
              className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white group-hover:flex"
            >
              ✕
            </button>
            {i === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center text-[10px] text-white">
                Principale
              </span>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          <span className="text-xl">+</span>
          <span className="text-xs">{uploading ? "Envoi..." : "Ajouter"}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <p className="mt-1 text-xs text-muted-foreground">
        JPEG, PNG ou WebP — 8 Mo max. La première image est l&apos;image
        principale.
      </p>
    </div>
  );
}
