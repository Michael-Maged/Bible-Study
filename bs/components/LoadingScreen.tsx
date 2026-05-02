'use client'

import { motion } from 'framer-motion'
import AppLogo from '@/components/AppLogo'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background z-[9999] flex flex-col items-center justify-center gap-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <AppLogo size="lg" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"
      />
    </div>
  )
}
