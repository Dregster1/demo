'use client'

import { motion } from 'framer-motion'

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <motion.h1
        initial={{ y: 0 }}
        animate={{ y: [-4, 4, -4] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="text-4xl md:text-6xl text-center font-light text-gray-100"
      >
        Bienvenido
      </motion.h1>
    </div>
  )
}
