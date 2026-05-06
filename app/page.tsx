'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db, type Food, type Category, type Tag } from '@/lib/firebase'
import AddFoodModal from '@/components/AddFoodModal'
import FoodCard from '@/components/FoodCard'
import PushNotificationButton from '@/components/PushNotificationButton'
import TagManager from '@/components/TagManager'

const CATEGORIES: Array<'全て' | Category> = ['全て', '冷蔵', '冷凍', '常温']

const CATEGORY_ICONS: Record<string, string> = {
  全て: '🍽️', 冷蔵: '🧊', 冷凍: '❄️', 常温: '🏠',
}

const CATEGORY_ACTIVE: Record<string, string> = {
  全て: 'from-emerald-500 to-teal-500 shadow-emerald-500/30',
  冷蔵: 'from-blue-500 to-cyan-400 shadow-blue-500/30',
  冷凍: 'from-violet-500 to-indigo-400 shadow-violet-500/30',
  常温: 'from-amber-500 to-orange-400 shadow-amber-500/30',
}

export default function Home() {
  const [foods, setFoods] = useState<Food[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [activeCategory, setActiveCategory] = useState<'全て' | Category>('全て')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showTagManager, setShowTagManager] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const [foodsSnap, tagsSnap] = await Promise.all([
        getDocs(query(collection(db, 'foods'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'tags'), orderBy('created_at', 'asc'))),
      ])
      const foodData = foodsSnap.docs.map((d) => {
        const raw = d.data()
        return { id: d.id, ...raw, tags: raw.tags ?? [] } as Food
      })
      foodData.sort((a, b) => {
        if (!a.expiry_date && !b.expiry_date) return 0
        if (!a.expiry_date) return 1
        if (!b.expiry_date) return -1
        return a.expiry_date.localeCompare(b.expiry_date)
      })
      setFoods(foodData)
      setTags(tagsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Tag)))
      setLoading(false)
    }
    loadData()
  }, [])

  const filtered = foods
    .filter((f) => activeCategory === '全て' || f.category === activeCategory)
    .filter((f) => activeTag === null || f.tags?.includes(activeTag))

  const expiringCount = foods.filter((f) => {
    if (!f.expiry_date) return false
    const days = Math.ceil((new Date(f.expiry_date).getTime() - Date.now()) / 86400000)
    return days >= 0 && days <= 3
  }).length

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-4 shadow-xl shadow-emerald-900/40">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">🌿 冷蔵庫管理</h1>
            {expiringCount > 0 ? (
              <p className="text-xs text-emerald-100 mt-0.5">⚠️ {expiringCount}品が3日以内に期限切れ</p>
            ) : (
              <p className="text-xs text-emerald-200/60 mt-0.5">在庫をきちんと管理中</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTagManager(true)}
              className="text-xs text-emerald-100 border border-emerald-400/50 rounded-full px-3 py-1.5 hover:bg-white/10 transition-colors"
            >
              タグ管理
            </button>
            <span className="bg-white/20 text-white text-sm font-semibold rounded-full px-3 py-1">
              {foods.length}品
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 pb-28">
        {/* Push notification */}
        <div className="mb-4">
          <PushNotificationButton />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const count = cat === '全て' ? foods.length : foods.filter((f) => f.category === cat).length
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${CATEGORY_ACTIVE[cat]} text-white shadow-md`
                    : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-700'
                }`}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                <span>{cat}</span>
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                  isActive ? 'bg-white/25 text-white' : 'bg-gray-800 text-gray-500'
                }`}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Tag filters */}
        {tags.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveTag(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTag === null
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-gray-900 text-gray-500 border border-gray-800 hover:border-gray-700'
              }`}
            >
              すべて
            </button>
            {tags.map((tag) => {
              const count = foods.filter((f) => f.tags?.includes(tag.name)).length
              const isActive = activeTag === tag.name
              return (
                <button
                  key={tag.id}
                  onClick={() => setActiveTag(isActive ? null : tag.name)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-gray-900 text-gray-500 border border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {tag.name}
                  <span className={`rounded-full px-1.5 ${
                    isActive ? 'bg-emerald-500/30 text-emerald-300' : 'bg-gray-800 text-gray-600'
                  }`}>{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Food list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 text-sm">読み込み中...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-gray-400 font-medium">食材がありません</p>
            <p className="text-gray-600 text-sm mt-1">下の＋ボタンで追加しましょう</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                onDeleted={(id) => setFoods((prev) => prev.filter((f) => f.id !== id))}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-7 right-5 w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-3xl rounded-full shadow-xl shadow-emerald-500/40 flex items-center justify-center active:scale-95 hover:shadow-2xl hover:shadow-emerald-500/50 transition-all"
        aria-label="食材を追加"
      >
        +
      </button>

      {showModal && (
        <AddFoodModal
          tags={tags}
          onAdded={(food) => setFoods((prev) => [food, ...prev])}
          onClose={() => setShowModal(false)}
        />
      )}

      {showTagManager && (
        <TagManager
          tags={tags}
          onTagsChanged={setTags}
          onClose={() => setShowTagManager(false)}
        />
      )}
    </div>
  )
}
