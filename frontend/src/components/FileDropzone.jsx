import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText } from 'lucide-react'
import { cn } from '../lib/utils'

export default function FileDropzone({ files, onChange, maxFiles = 5 }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles)
      onChange(newFiles)
    },
    [files, onChange, maxFiles]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles,
  })

  const removeFile = (index) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    onChange(newFiles)
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors',
          isDragActive ? 'border-primary-500 bg-primary-500/5' : 'border-slate-600 hover:border-slate-500',
          files.length >= maxFiles && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-2 text-slate-400" size={28} />
        <p className="text-sm text-slate-300">
          {isDragActive ? 'Rilascia i file qui...' : 'Trascina file o clicca per selezionarli'}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Max {maxFiles} file — JPG, PNG, PDF, DOCX, XLSX
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Dimensione massima consigliata: 10MB per file
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-700/50 rounded-lg px-3 py-2">
              <FileText size={18} className="text-primary-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{file.name}</div>
                <div className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
              <button
                onClick={() => removeFile(i)}
                className="p-1 hover:bg-rose-500/10 rounded text-rose-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

