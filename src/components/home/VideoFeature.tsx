"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Play } from "lucide-react";

interface VideoFeatureProps {
  videoId: string;
  title: string;
}

export function VideoFeature({ videoId, title }: VideoFeatureProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const [userStarted, setUserStarted] = useState(false);

  // IntersectionObserver: start playback automatically once the player scrolls into view.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const watchUrl = useMemo(
    () => `https://www.youtube.com/watch?v=${videoId}`,
    [videoId],
  );

  // Autoplay, muted, loop, inline. mute is required for autoplay compliance.
  const embedUrl = useMemo(
    () =>
      `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playsinline=1&rel=0&playlist=${videoId}`,
    [videoId],
  );

  const thumbnailUrl = useMemo(
    () => `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    [videoId],
  );

  const showVideo = active || userStarted;

  const handlePlay = () => setUserStarted(true);

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg bg-black"
        style={{ paddingBottom: "56.25%" }}
      >
        {showVideo ? (
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={handlePlay}
            aria-label={`Play ${title}`}
            className="group absolute inset-0 h-full w-full"
          >
            {/* Thumbnail */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            {/* Dark overlay for contrast */}
            <span className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/50" />
            {/* Play button */}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-[hsl(var(--nav-theme))] text-white shadow-lg shadow-[hsl(var(--nav-theme)/0.4)] transition-transform group-hover:scale-110">
                <Play className="h-7 w-7 md:h-9 md:w-9 translate-x-0.5" fill="currentColor" />
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="flex justify-center">
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
        >
          Watch on YouTube
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
