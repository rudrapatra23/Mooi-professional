"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Heart, Play, ShoppingBag, Pause, X } from "lucide-react";
import Link from 'next/link';

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
  const [isPaused, setIsPaused] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Duplicate videos to create infinite loop effect
  const displayVideos = [...videos, ...videos];

  return (
    <div className="py-20 bg-black text-white overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6 mb-10 flex flex-col md:flex-row items-end justify-between gap-6">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-[#CB9800] uppercase mb-2">Real Results</h2>
          <h1 className="text-4xl md:text-5xl font-serif">Mooi Moments</h1>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-400 max-w-xs text-right hidden md:block">
            Join our community. Tag @MooiProfessional to be featured.
          </p>
        </div>
      </div>

      <div
        className="relative w-full"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className={`flex gap-6 w-max ${!isPaused ? 'animate-marquee' : ''}`}
          style={{
            animationPlayState: isPaused ? 'paused' : 'running',
            animationDuration: '60s' // Slow down scrolling
          }}
        >
          {displayVideos.map((src, index) => (
            <div
              key={index}
              onClick={() => setSelectedVideo(src)}
              className="relative w-[280px] h-[450px] bg-gray-900 border border-gray-800 hover:border-[#CB9800] transition-colors group flex-shrink-0 cursor-pointer"
            >
              <video
                src={src}
                muted
                loop
                autoPlay
                playsInline
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/50">
                  <Play size={20} fill="white" className="text-white ml-1" />
                </div>
              </div>

              <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <p className="text-xs font-bold text-[#CB9800] uppercase tracking-wider mb-2">Featured Look</p>
                <div className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-[#CB9800] hover:text-white transition-colors">
                  <ShoppingBag size={14} /> View Details
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-sm sm:max-w-md max-h-[90vh] flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <span className="text-sm font-bold uppercase tracking-widest mr-2">Close</span>
              <X size={24} className="inline" />
            </button>

            <div className="w-full h-full border border-gray-800 bg-black shadow-2xl overflow-hidden relative">
              <video
                src={selectedVideo}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain max-h-[80vh]"
              />
            </div>

            <Link
              href="/shop"
              className="mt-6 flex items-center justify-center gap-2 w-full py-4 bg-[#CB9800] text-white text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
            >
              <ShoppingBag size={16} /> Shop This Look
            </Link>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
    </div>
  );
}
