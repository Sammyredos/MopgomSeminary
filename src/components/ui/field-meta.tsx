import React from 'react'

type FieldMetaProps = {
  type: string
  options?: string[]
  note?: string
}

export function FieldMeta({ type, options, note }: FieldMetaProps) {
  return (
    <p className="text-xs text-gray-500 mt-1">
      Type: {type}
      {options && options.length > 0 ? ` • Options: ${options.join(', ')}` : ''}
      {note ? ` • ${note}` : ''}
    </p>
  )
}