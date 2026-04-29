import React from 'react'
import { cn } from '../../lib/utils'

const variants = {
  primary:
    'bg-accent text-text-primary font-medium shadow-card hover:bg-accent-hover hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-main disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
  dangerFilled:
    'bg-semantic-danger text-white font-medium shadow-card hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-danger/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-main disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
  secondary:
    'border border-border-subtle bg-transparent text-text-primary font-medium hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-main disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
  danger:
    'border border-semantic-danger/30 bg-semantic-danger/10 text-semantic-danger font-medium hover:bg-semantic-danger/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-danger/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-main disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
  ghost:
    'text-text-primary font-medium hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-main disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
}

export default function Button({
  variant = 'primary',
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-ds px-4 py-2 text-sm transition-colors duration-150',
        variants[variant],
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <Spinner />
          <span className="sr-only">Caricamento</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}
