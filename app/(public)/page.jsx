'use client'
import { motion } from "framer-motion"
import Hero from "@/components/Hero";
import dynamic from 'next/dynamic';

const BestSelling = dynamic(() => import("@/components/BestSelling"), {
  loading: () => <div className="h-96 bg-gray-50 animate-pulse" />
});
const Newsletter = dynamic(() => import("@/components/Newsletter"));
const OurSpecs = dynamic(() => import("@/components/OurSpec"));
const LatestProducts = dynamic(() => import("@/components/LatestProducts"), {
  loading: () => <div className="h-96 md:h-[500px] bg-white animate-pulse" />
});
const ShopByCategory = dynamic(() => import("@/components/ShopByCategory"), {
  loading: () => <div className="h-40 bg-gray-50 animate-pulse my-10" />
});
const Reels = dynamic(() => import("@/components/Reels"), {
  loading: () => <div className="h-96 bg-black animate-pulse" />
});

export default function Home() {
  // Variants for sections
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    show: (delay = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 20,
        delay,
      },
    }),
  };

  return (
    <div className="overflow-hidden">
      {/* Hero - load instantly */}
      <Hero />

      {/* Shop by Category */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        custom={0.0}
      >
        <ShopByCategory />
      </motion.section>

      {/* Latest Products */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        custom={0.1}
      >
        <LatestProducts />
      </motion.section>

      {/* Best Selling */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        custom={0.2}
      >
        <BestSelling />
      </motion.section>

      {/* Our Specs */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        custom={0.3}
      >
        <OurSpecs />
        <Reels />
      </motion.section>

      {/* Newsletter */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        custom={0.4}
      >
        <Newsletter />
      </motion.section>
    </div>
  );
}
