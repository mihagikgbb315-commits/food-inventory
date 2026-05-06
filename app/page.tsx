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
  全て: '🍽️',
  冷蔵: '🧊',
  冷凍: '❄️',
  常温: '🏠',
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
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-green-600 text-white px-4 py-3 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">冷蔵庫管理</h1>
            {expiringCount > 0 && (
              <p className="text-xs text-green-100">⚠️ {expiringCount}品が3日以内に期限切れ</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTagManager(true)}
              className="text-xs text-green-100 border border-green-400 rounded-full px-2.5 py-1 hover:bg-green-500 transition-colors"
            >
              タグ管理
            </button>
            <span className="text-sm text-green-100">{foods.length}品</span>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 pb-24">
        <div className="mb-4">
          <PushNotificationButton />
        </div>

        {/* カテゴリフィルター */}
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const count = cat === '全て' ? foods.length : foods.filter((f) => f.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                <span>{cat}</span>
                <span className={`text-xs rounded-full px-1.5 ${
                  activeCategory === cat ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* タグフィルター */}
        {tags.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTag(null)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeTag === null
                  ? 'bg-gray-700 text-white'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              すべて
            </button>
            {tags.map((tag) => {
              const count = foods.filter((f) => f.tags?.includes(tag.name)).length
              return (
                <button
                  key={tag.id}
                  onClick={() => setActiveTag(activeTag === tag.name ? null : tag.name)}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    activeTag === tag.name
                      ? 'bg-gray-700 text-white'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {tag.name}
                  <span className={`text-xs rounded-full px-1.5 ${
                    activeTag === tag.name ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🛒</p>
            <p className="text-sm">食材がありません</p>
            <p className="text-xs mt-1">下の＋ボタンで追加しましょう</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
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

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 text-white text-3xl rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 active:scale-95 transition-all"
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
