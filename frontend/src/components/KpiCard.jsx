import React, { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

export default function KpiCard({ title, value, icon: Icon, colorClass = 'text-primary-400', delay = 0 }) {
  const [displayValue, setDisplayValue] = useState(0)
  const spring = useSpring(0, { stiffness: 60, damping: 20 })
  const rounded = useTransform(spring, (v) => Math.round(v))

  useEffect(() => {
    const unsub = rounded.on('change', (v) => setDisplayValue(v))
    spring.set(value || 0)
    return () => unsub()
  }, [value, spring, rounded])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-lg bg-slate-700/50 flex items-center justify-center ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <div className="text-sm text-slate-400">{title}</div>
        <div className="text-2xl font-bold text-white">{displayValue}</div>
      </div>
    </motion.div>
  )
}

