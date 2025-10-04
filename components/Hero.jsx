'use client'
import { ArrowRightIcon } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import slideshow2 from '@/assets/slideshow2.png'

const Hero = () => {
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.04 } },
  }
  const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22 } },
  }

  return (
    // no margin or padding on top; sits right under navbar
    <section className="relative w-full overflow-hidden">
      {/* Aspect-ratio wrapper (16:9 on mobile; a bit wider on larger screens) */}
      <div className="relative w-full pt-[56.25%] sm:pt-[45%] md:pt-[40%] lg:pt-[38%]">
        {/* Background image */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.04, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { duration: 0.9, ease: 'easeOut' } }}
        >
          <Image
            src={slideshow2}
            alt="Hero background"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Subtle bottom gradient for text readability (no gray at top) */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/55" />
        </motion.div>

        {/* Overlay content (centered); only CTA on mobile */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white px-5 text-center"
        >
          {/* Hidden on mobile; shows from sm+ */}
          <motion.h1
            variants={fadeUp}
            className="hidden sm:block text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
          >
            Transform Your Style <br className="hidden md:block" /> with Premium Care
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="hidden sm:block mt-3 md:mt-4 text-base md:text-lg text-gray-100/95 max-w-2xl mx-auto leading-relaxed"
          >
            Discover the best in hair &amp; skin care — crafted for elegance and confidence.
          </motion.p>

          
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
