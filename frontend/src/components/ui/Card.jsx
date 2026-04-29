import React from 'react'
import { cn, ui } from '../../lib/utils'

export default function Card({ children, className }) {
  return <div className={cn(ui.card, className)}>{children}</div>
}

export function CardHeader({ title, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4', className)}>
      <h3 className="text-[15px] font-semibold tracking-tight text-text-primary">{title}</h3>
      {action && <div className="shrink-0 text-[13px] font-medium text-accent">{action}</div>}
    </div>
  )
}

export function CardBody({ children, className }) {
  return <div className={cn('p-5', className)}>{children}</div>
}
