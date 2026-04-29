import React from 'react'
import { cn, ui } from '../../lib/utils'

export function SelectField({
  label,
  error,
  id,
  className,
  wrapperClassName,
  children,
  ...props
}) {
  const sid = id || props.name || label?.replace(/\s+/g, '-').toLowerCase()
  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label && (
        <label htmlFor={sid} className={ui.label}>
          {label}
        </label>
      )}
      <select id={sid} className={cn(ui.select, error && 'border-semantic-danger focus:border-semantic-danger focus:ring-semantic-danger/20', className)} {...props}>
        {children}
      </select>
      {error && <p className="mt-1.5 text-xs text-semantic-danger">{error}</p>}
    </div>
  )
}

export function TextField({
  label,
  error,
  id,
  leftIcon: LeftIcon,
  className,
  wrapperClassName,
  ...props
}) {
  const sid = id || props.name || label?.replace(/\s+/g, '-').toLowerCase()
  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label && (
        <label htmlFor={sid} className={ui.label}>
          {label}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <LeftIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" aria-hidden />
        )}
        <input
          id={sid}
          className={cn(ui.input, LeftIcon && 'pl-10', error && 'border-semantic-danger focus:border-semantic-danger focus:ring-semantic-danger/20', className)}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-semantic-danger">{error}</p>}
    </div>
  )
}
