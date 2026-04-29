import React, { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn, ui } from '../lib/utils'

export default function KpiCard({
  title,
  value,
  icon: Icon,
  delay = 0,
  trendPercent,
  trendPositive,
}) {
  const [displayValue, setDisplayValue] = useState(0)
  const spring = useSpring(0, { stiffness: 60, damping: 20 })
  const rounded = useTransform(spring, (v) => Math.round(v))

  useEffect(() => {
    const unsub = rounded.on('change', (v) => setDisplayValue(v))
    spring.set(Number(value) || 0)
    return () => unsub()
  }, [value, spring, rounded])

  const showTrend = typeof trendPercent === 'number'
  const positive = trendPositive !== false

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(ui.cardSection, 'relative flex flex-col overflow-hidden')}
    >
      <div className="absolute right-4 top-4 text-text-secondary opacity-80">
        <Icon size={22} strokeWidth={1.75} aria-hidden />
      </div>
      <div className="text-xs font-medium uppercase tracking-wide text-text-secondary">{title}</div>
      <div className="mt-2 text-[28px] font-bold tabular-nums tracking-tight text-text-primary">{displayValue}</div>
      {showTrend && (
        <div
          className={cn(
            'mt-2 inline-flex items-center gap-1 text-xs font-medium',
            positive ? 'text-semantic-success' : 'text-semantic-danger'
          )}
        >
          {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{Math.abs(trendPercent)}%</span>
          <span className="font-normal text-text-secondary">vs periodo precedente</span>
        </div>
      )}
    </motion.div>
  )
}
