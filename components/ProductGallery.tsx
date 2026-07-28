'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { CatalogMedia } from '@/lib/catalog';

/**
 * Product gallery supporting both images and video.
 *
 * Videos are never autoplayed — an unexpected autoplay on mobile data is
 * hostile. Thumbnails carry a play badge so the video is still discoverable.
 */
export default function ProductGallery({ media, name }: { media: CatalogMedia[]; name: string }) {
  const [active, setActive] = useState(0);

  if (media.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-mist-200 bg-mist-100 text-sm text-neutral-400">
        No image available
      </div>
    );
  }

  const current = media[Math.min(active, media.length - 1)]!;

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-mist-200 bg-mist-100">
        {current.type === 'VIDEO' ? (
          <video
            key={current.url}
            src={current.url}
            poster={current.posterUrl ?? undefined}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          >
            Your browser cannot play this video.
          </video>
        ) : (
          <Image
            src={current.url}
            alt={current.alt || name}
            fill
            sizes="(max-width: 1024px) 100vw, 550px"
            className="object-cover"
            priority
          />
        )}
      </div>

      {media.length > 1 && (
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto">
          {media.map((item, index) => (
            <button
              key={item.url}
              onClick={() => setActive(index)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                active === index ? 'border-denim-700' : 'border-mist-200 hover:border-mist-300'
              }`}
              aria-label={
                item.type === 'VIDEO'
                  ? 'Play product video'
                  : `View image ${index + 1} of ${media.length}`
              }
            >
              {/* A video with no poster has no still to show — next/image cannot
                  render an .mp4 — so fall back to a plain dark tile. */}
              {item.type === 'VIDEO' && !item.posterUrl ? (
                <span className="block h-full w-full bg-denim-800" />
              ) : (
                <Image
                  src={item.type === 'VIDEO' ? item.posterUrl! : item.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
              {item.type === 'VIDEO' && (
                <span className="absolute inset-0 flex items-center justify-center bg-denim-900/35">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
