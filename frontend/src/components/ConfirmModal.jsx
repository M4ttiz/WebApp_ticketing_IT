import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import Button from './ui/Button'

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  onConfirm,
  onCancel,
  danger,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-[4px]"
          onClick={onCancel}
          role="presentation"
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-ds-lg border border-border-subtle bg-surface-card shadow-elevated"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
          >
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <div id="confirm-modal-title" className="flex items-center gap-2 font-semibold text-text-primary">
                {danger && <AlertTriangle size={18} className="text-semantic-danger" />}
                {title}
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-ds p-1 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                aria-label="Chiudi"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 text-sm leading-relaxed text-text-secondary">{message}</div>
            <div className="flex justify-end gap-2 border-t border-border-subtle bg-surface-main/40 px-5 py-4">
              <Button type="button" variant="secondary" onClick={onCancel}>
                {cancelText}
              </Button>
              <Button type="button" variant={danger ? 'dangerFilled' : 'primary'} onClick={onConfirm}>
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
