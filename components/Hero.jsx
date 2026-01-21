'use client'
import { ArrowRightIcon } from 'lucide-react'
import Image from 'next/image'
import slideshow2 from '@/assets/slideshow2.png'
import Link from 'next/link'

const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative w-full pt-[56.25%] sm:pt-[45%] md:pt-[40%] lg:pt-[38%]">
        <div className="absolute inset-0">
          <Image
            src={slideshow2}
            alt="Hero background"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/55" />
        </div>

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white px-5 text-center">
          <h1 className="hidden sm:block text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            Transform Your Style <br className="hidden md:block" /> with Premium Care
          </h1>

          <p className="hidden sm:block mt-3 md:mt-4 text-base md:text-lg text-gray-100/95 max-w-2xl mx-auto leading-relaxed">
            Discover the best in hair &amp; skin care — crafted for elegance and confidence.
          </p>

          {/* CTA hidden on mobile, visible from sm+ */}
          <div className="mt-5 sm:mt-6">
            <Link
              href="/shop"
              prefetch
              className="hidden sm:inline-flex items-center gap-2 bg-black hover:bg-zinc-900 border-2 border-transparent hover:border-yellow-600 text-white px-8 py-3 rounded-none text-sm md:text-base font-bold uppercase tracking-widest transition-all"
            >
              Shop Products <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
