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
  // 食材
  冷蔵: 'border-l-blue-400',
  冷凍: 'border-l-violet-400',
  常温: 'border-l-amber-400',
  // 日用品
  'トイレタリー': 'border-l-pink-400',
  '洗剤・クリーナー': 'border-l-cyan-400',
  'キッチン用品': 'border-l-orange-400',
  '衛生用品': 'border-l-green-400',
  // 防災用品
  '食料・水': 'border-l-yellow-400',
  '救急・医療': 'border-l-red-400',
  '照明・電源': 'border-l-indigo-400',
  '工具・避難用品': 'border-l-stone-400',
  'その他': 'border-l-gray-500',
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
  const borderClass = CATEGORY_BORDER[food.category] ?? 'border-l-gray-500'

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`「${food.name}」を削除しますか？`)) return
    setDeleting(true)
    await deleteDoc(doc(db, 'foods', food.id))
    onDeleted(food.id)
  }

  return (
    <div
      onClick={() => onEdit(food)}
      className={`flex items-center bg-gray-900 border border-gray-800 border-l-4 ${borderClass} rounded-xl px-3 py-2.5 gap-2 cursor-pointer hover:border-gray-700 active:bg-gray-800/80 transition-all`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-white text-sm">{food.name}</span>
          <span className="text-xs text-gray-500 flex-shrink-0">{food.quantity} {food.unit}</span>
          {food.tags?.map((tag) => (
            <span key={tag} className="text-xs bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/25 flex-shrink-0">
              {tag}
            </span>
          ))}
        </div>
        {food.memo && (
          <p className="text-xs text-gray-600 mt-0.5 truncate">{food.memo}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {status && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${status.style}`}>
            {status.label}
          </span>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-gray-700 hover:text-red-400 transition-colors text-xl leading-none disabled:opacity-30 p-1"
          aria-label="削除"
        >
          ×
        </button>
      </div>
    </div>
  )
}
