'use client'
import { motion } from "framer-motion"
import BestSelling from "@/components/BestSelling";
import Hero from "@/components/Hero";
import Newsletter from "@/components/Newsletter";
import OurSpecs from "@/components/OurSpec";
import LatestProducts from "@/components/LatestProducts";
import ShopByCategory from "@/components/ShopByCategory";

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
        viewport={{ once: true, amount: 0.2 }}
        custom={0.0}
      >
        <ShopByCategory />
      </motion.section>
      {/* Latest Products */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        custom={0.1}
      >
        <LatestProducts />
      </motion.section>

      {/* Best Selling */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        custom={0.2}
      >
        <BestSelling />
      </motion.section>

      {/* Our Specs */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        custom={0.3}
      >
        <OurSpecs />
      </motion.section>

      {/* Newsletter */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        custom={0.4}
      >
        <Newsletter />
      </motion.section>
    </div>
  );
}
