'use client'

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white text-gray-900 overflow-hidden">
      <h1 className="text-4xl font-light tracking-[0.15em] leading-none">
        <span className="inline-block will-change-transform transform-gpu origin-center [backface-visibility:hidden] animate-[zoom_3.5s_ease-in-out_infinite]">
          MOOI Professional
        </span>
      </h1>

      <p className="mt-2 text-sm text-gray-500 animate-pulse select-none">
        Loading...
      </p>

      <style jsx>{`
        @keyframes zoom {
          0% {
            opacity: 0;
            transform: translateZ(0) scale(0.6);
          }
          40% {
            opacity: 1;
            transform: translateZ(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateZ(0) scale(4);
          }
        }
      `}</style>
    </div>
  )
}
