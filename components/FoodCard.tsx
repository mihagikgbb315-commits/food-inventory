'use client'

import { differenceInDays, parseISO } from 'date-fns'
import { doc, deleteDoc } from 'firebase/firestore'
import { db, type Food } from '@/lib/firebase'
import { useState } from 'react'

type Props = {
  food: Food
  onDeleted: (id: string) => void
  onEdit: (food: Food) => void
}

const CATEGORY_BORDER: Record<string, string> = {
  冷蔵: 'border-l-blue-400',
  冷凍: 'border-l-violet-400',
  常温: 'border-l-amber-400',
}

function expiryStatus(expiryDate: string | null) {
  if (!expiryDate) return null
  const days = differenceInDays(parseISO(expiryDate), new Date())
  if (days < 0) return { label: `${Math.abs(days)}日超過`, style: 'bg-red-500/20 text-red-400 border border-red-500/30' }
  if (days === 0) return { label: '今日まで', style: 'bg-red-500/20 text-red-400 border border-red-500/30' }
  if (days <= 3) return { label: `あと${days}日`, style: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' }
  return { label: `あと${days}日`, style: 'bg-gray-800 text-gray-500 border border-gray-700' }
}

export default function FoodCard({ food, onDeleted, onEdit }: Props) {
  const [deleting, setDeleting] = useState(false)
  const status = expiryStatus(food.expiry_date)

  const handleDelete = async () => {
    if (!confirm(`「${food.name}」を削除しますか？`)) return
    setDeleting(true)
    await deleteDoc(doc(db, 'foods', food.id))
    onDeleted(food.id)
  }

  return (
    <div className={`flex items-center bg-gray-900 border border-gray-800 border-l-4 ${CATEGORY_BORDER[food.category]} rounded-2xl px-4 py-3.5 transition-all hover:border-gray-700`}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{food.name}</p>
        <p className="text-sm text-gray-500 mt-0.5">{food.quantity} {food.unit}</p>
        {food.memo && (
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{food.memo}</p>
        )}
        {food.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {food.tags.map((tag) => (
              <span key={tag} className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/25">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
        {status && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${status.style}`}>
            {status.label}
          </span>
        )}
        <button
          onClick={() => onEdit(food)}
          className="text-gray-600 hover:text-emerald-400 transition-colors p-1"
          aria-label="編集"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-gray-700 hover:text-red-400 transition-colors text-xl leading-none disabled:opacity-30"
        >
          ×
        </button>
      </div>
    </div>
  )
}
