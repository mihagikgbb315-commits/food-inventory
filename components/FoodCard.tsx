'use client'

import { differenceInDays, parseISO } from 'date-fns'
import { doc, deleteDoc } from 'firebase/firestore'
import { db, type Food } from '@/lib/firebase'
import { useState } from 'react'

type Props = {
  food: Food
  onDeleted: (id: string) => void
}

function expiryStatus(expiryDate: string | null) {
  if (!expiryDate) return { label: '', color: '' }
  const days = differenceInDays(parseISO(expiryDate), new Date())
  if (days < 0) return { label: `${Math.abs(days)}日超過`, color: 'text-red-600 bg-red-50' }
  if (days === 0) return { label: '今日まで', color: 'text-red-600 bg-red-50' }
  if (days <= 3) return { label: `あと${days}日`, color: 'text-orange-600 bg-orange-50' }
  return { label: `あと${days}日`, color: 'text-gray-500 bg-gray-50' }
}

export default function FoodCard({ food, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false)
  const status = expiryStatus(food.expiry_date)

  const handleDelete = async () => {
    if (!confirm(`「${food.name}」を削除しますか？`)) return
    setDeleting(true)
    await deleteDoc(doc(db, 'foods', food.id))
    onDeleted(food.id)
  }

  return (
    <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{food.name}</p>
        <p className="text-sm text-gray-500">{food.quantity} {food.unit}</p>
        {food.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {food.tags.map((tag) => (
              <span key={tag} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 ml-3">
        {status.label && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${status.color}`}>
            {status.label}
          </span>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-gray-300 hover:text-red-500 transition-colors text-xl leading-none disabled:opacity-50"
        >
          ×
        </button>
      </div>
    </div>
  )
}
