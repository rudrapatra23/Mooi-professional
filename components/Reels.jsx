"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Heart, Play } from "lucide-react";

const videos = [
  "https://res.cloudinary.com/df367il5r/video/upload/v1766147070/06_rlnj7s.mp4",
  "https://res.cloudinary.com/df367il5r/video/upload/v1766147070/05R_e4dxh9.mp4",
  "https://res.cloudinary.com/df367il5r/video/upload/v1766147067/08R_dyilif.mp4",
  "https://res.cloudinary.com/df367il5r/video/upload/v1766147061/07R_ueuzhy.mp4",
  "https://res.cloudinary.com/df367il5r/video/upload/v1766147059/09R_qe90vi.mp4",
  "https://res.cloudinary.com/df367il5r/video/upload/v1766147057/01R_h9bweh.mp4",
  "https://res.cloudinary.com/df367il5r/video/upload/v1766147052/02R_m5jpgt.mp4",
  "https://res.cloudinary.com/df367il5r/video/upload/v1766147040/04R_e9v4qr.mp4",
  "https://res.cloudinary.com/df367il5r/video/upload/v1766147032/03R_ixpv8k.mp4",
];

export default function Reels() {
  const videoRefs = useRef([]);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState({});
  const [activeVideo, setActiveVideo] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          const index = videoRefs.current.indexOf(video);

          if (entry.isIntersecting) {
            video.play();
            setActiveVideo(index);
          } else {
            video.pause();
          }
        });
      },
      {
        threshold: 0.7,
        root: document.querySelector(".scroll-container"),
      }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, []);

  const toggleLike = (index) => {
    setLiked((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <h1 className="text-4xl font-bold mb-6 text-center">Reels</h1>

        {/* Scroll Container */}
        <div className="scroll-container overflow-x-auto overflow-y-hidden pb-6 px-4 sm:px-0 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-slate-800">
          <div className="flex gap-6 w-max">
            {videos.map((src, index) => (
              <div
                key={index}
                className="group relative w-72 h-96 rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-all duration-300 flex-shrink-0"
              >
                {/* Video */}
                <video
                  ref={(el) => (videoRefs.current[index] = el)}
                  src={src}
                  muted={muted}
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                />

                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

                {/* Play Overlay */}
                {activeVideo !== index && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Play size={32} className="text-white ml-1" fill="white" />
                    </div>
                  </div>
                )}

                {/* Top Controls */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>

                  <button
                    onClick={() => setMuted(!muted)}
                    className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    {muted ? (
                      <VolumeX size={16} className="text-white" />
                    ) : (
                      <Volume2 size={16} className="text-white" />
                    )}
                  </button>
                </div>

                {/* Like Button Only */}
                <div className="absolute right-3 bottom-20 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleLike(index)}
                    className="text-white transform hover:scale-110 transition-transform"
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${
                        liked[index]
                          ? "bg-red-500"
                          : "bg-black/50 backdrop-blur-md"
                      } flex items-center justify-center`}
                    >
                      <Heart
                        size={18}
                        fill={liked[index] ? "white" : "none"}
                      />
                    </div>
                  </button>
                </div>

                {/* Bottom Text */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
                  <h3 className="font-bold text-sm mb-1 drop-shadow-lg">
                    Reel #{index + 1}
                  </h3>
                  <p className="text-xs text-gray-200 line-clamp-2 drop-shadow-lg">
                    Amazing content 
                  </p>
                </div>

                {/* Hover Border */}
                <div className="absolute inset-0 rounded-2xl border-2 border-purple-500/0 group-hover:border-purple-500/50 transition-all pointer-events-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Hint */}
        <div className="flex items-center justify-center gap-2 mt-6 text-gray-400 text-sm">
          <svg
            className="w-5 h-5 animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span>Scroll to see more</span>
        </div>
      </div>
    </div>
  );
}
