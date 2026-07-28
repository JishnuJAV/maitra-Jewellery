'use client';

import { useCallback, useRef, useState, type DragEvent } from 'react';

/**
 * Multi-file drag-and-drop uploader for product images and videos.
 *
 * Files go straight from the browser to Cloudinary using a signature minted by
 * /api/admin/upload/sign. Nothing passes through a Vercel function, so large
 * videos aren't limited by the 4.5 MB request-body cap.
 *
 * Gallery order is the array order; the first item is the product's primary
 * image. Items are reorderable by dragging.
 */

export type MediaItem = {
  /** Temporary client id for un-saved items; the database id once persisted. */
  key: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  publicId: string | null;
  posterUrl: string | null;
  alt: string;
  width: number | null;
  height: number | null;
};

type Pending = {
  key: string;
  name: string;
  progress: number;
  error?: string;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB
const ACCEPTED = 'image/jpeg,image/png,image/webp,image/avif,video/mp4,video/quicktime,video/webm';

export default function MediaUploader({
  items,
  onChange,
}: {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const uploadOne = useCallback(
    async (file: File) => {
      const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`;
      const isVideo = file.type.startsWith('video/');

      const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
      if (file.size > limit) {
        setPending((list) => [
          ...list,
          {
            key,
            name: file.name,
            progress: 0,
            error: `Too large (max ${Math.round(limit / 1024 / 1024)} MB)`,
          },
        ]);
        return;
      }

      setPending((list) => [...list, { key, name: file.name, progress: 0 }]);

      try {
        const signResponse = await fetch('/api/admin/upload/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resourceType: isVideo ? 'video' : 'image' }),
        });
        const signed = (await signResponse.json()) as {
          error?: string;
          cloudName: string;
          apiKey: string;
          timestamp: number;
          signature: string;
          folder: string;
          uploadUrl: string;
        };

        if (!signResponse.ok) throw new Error(signed.error || 'Could not authorise the upload.');

        const form = new FormData();
        form.append('file', file);
        form.append('api_key', signed.apiKey);
        form.append('timestamp', String(signed.timestamp));
        form.append('signature', signed.signature);
        form.append('folder', signed.folder);

        // XHR rather than fetch: fetch still can't report upload progress, and a
        // 100 MB video with no feedback looks broken.
        const result = await new Promise<{
          secure_url: string;
          public_id: string;
          width?: number;
          height?: number;
        }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', signed.uploadUrl);
          xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable) return;
            const progress = Math.round((event.loaded / event.total) * 100);
            setPending((list) =>
              list.map((entry) => (entry.key === key ? { ...entry, progress } : entry)),
            );
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              let message = `Upload failed (${xhr.status})`;
              try {
                message = JSON.parse(xhr.responseText)?.error?.message ?? message;
              } catch {
                /* keep the generic message */
              }
              reject(new Error(message));
            }
          };
          xhr.onerror = () => reject(new Error('Network error during upload.'));
          xhr.send(form);
        });

        onChange([
          ...items,
          {
            key: result.public_id,
            type: isVideo ? 'VIDEO' : 'IMAGE',
            url: result.secure_url,
            publicId: result.public_id,
            posterUrl: isVideo ? result.secure_url.replace(/\.[^.]+$/, '.jpg') : null,
            alt: '',
            width: result.width ?? null,
            height: result.height ?? null,
          },
        ]);
        setPending((list) => list.filter((entry) => entry.key !== key));
      } catch (error) {
        setPending((list) =>
          list.map((entry) =>
            entry.key === key
              ? { ...entry, error: error instanceof Error ? error.message : 'Upload failed' }
              : entry,
          ),
        );
      }
    },
    [items, onChange],
  );

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    // Sequential rather than parallel: a phone on mobile data uploading six
    // videos at once tends to stall them all.
    for (const file of Array.from(files)) {
      await uploadOne(file);
    }
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    void handleFiles(event.dataTransfer.files);
  }

  function moveItem(from: number, to: number) {
    if (from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    if (moved) next.splice(to, 0, moved);
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateAlt(index: number, alt: string) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, alt } : item)));
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragActive ? 'border-denim-500 bg-denim-50' : 'border-mist-300 bg-mist-50'
        }`}
      >
        <p className="text-sm font-medium text-denim-800">
          Drag photos or videos here, or{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-denim-600 underline underline-offset-2 hover:text-denim-800"
          >
            browse
          </button>
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          JPG, PNG, WebP or AVIF up to 10 MB · MP4, MOV or WebM up to 100 MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </div>

      {/* In-flight uploads */}
      {pending.length > 0 && (
        <ul className="space-y-2">
          {pending.map((entry) => (
            <li key={entry.key} className="rounded-lg border border-mist-200 bg-white px-3 py-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-neutral-700">{entry.name}</span>
                {entry.error ? (
                  <button
                    type="button"
                    onClick={() => setPending((list) => list.filter((item) => item.key !== entry.key))}
                    className="shrink-0 font-medium text-red-600 hover:underline"
                  >
                    {entry.error} — dismiss
                  </button>
                ) : (
                  <span className="shrink-0 tabular-nums text-neutral-500">{entry.progress}%</span>
                )}
              </div>
              {!entry.error && (
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-mist-200">
                  <div
                    className="h-full rounded-full bg-denim-600 transition-all"
                    style={{ width: `${entry.progress}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Gallery */}
      {items.length > 0 && (
        <>
          <p className="text-xs text-neutral-500">
            Drag to reorder. The first item is the main image shown on the product card.
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, index) => (
              <li
                key={item.key}
                draggable
                onDragStart={() => {
                  dragIndex.current = index;
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOverIndex(index);
                }}
                onDragEnd={() => {
                  dragIndex.current = null;
                  setOverIndex(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (dragIndex.current !== null) moveItem(dragIndex.current, index);
                  dragIndex.current = null;
                  setOverIndex(null);
                }}
                className={`group relative cursor-move overflow-hidden rounded-xl border bg-white transition-colors ${
                  overIndex === index ? 'border-denim-500 ring-2 ring-denim-200' : 'border-mist-200'
                }`}
              >
                <div className="relative aspect-square bg-mist-100">
                  {item.type === 'VIDEO' ? (
                    <video
                      src={item.url}
                      poster={item.posterUrl ?? undefined}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    // Plain <img>: these are freshly uploaded Cloudinary URLs that
                    // next/image would need configured remote patterns for.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt={item.alt} className="h-full w-full object-cover" />
                  )}

                  {index === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-denim-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Main
                    </span>
                  )}
                  {item.type === 'VIDEO' && (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-denim-900/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Video
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    aria-label="Remove"
                    className="absolute bottom-1.5 right-1.5 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-red-600 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 focus:opacity-100"
                  >
                    Remove
                  </button>
                </div>

                <input
                  type="text"
                  value={item.alt}
                  onChange={(event) => updateAlt(index, event.target.value)}
                  placeholder="Describe this image"
                  aria-label="Image description for accessibility"
                  className="w-full border-t border-mist-200 px-2 py-1.5 text-xs outline-none focus:bg-mist-50"
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
