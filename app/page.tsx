'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db, type Food, type Section, type Tag, SECTION_CATEGORIES } from '@/lib/firebase'
import AddFoodModal from '@/components/AddFoodModal'
import EditFoodModal from '@/components/EditFoodModal'
import FoodCard from '@/components/FoodCard'
import PushNotificationButton from '@/components/PushNotificationButton'
import TagManager from '@/components/TagManager'

const SECTIONS: Section[] = ['食材', '日用品', '防災用品']

const SECTION_ICONS: Record<Section, string> = {
  食材: '🥦',
  日用品: '🧴',
  防災用品: '🎒',
}

const SECTION_ACTIVE: Record<Section, string> = {
  食材: 'from-emerald-500 to-teal-500 shadow-emerald-500/30',
  日用品: 'from-blue-500 to-sky-400 shadow-blue-500/30',
  防災用品: 'from-amber-500 to-orange-400 shadow-amber-500/30',
}

type SortKey = 'expiry' | 'name' | 'category' | 'added'

const SORT_LABELS: Record<SortKey, string> = {
  expiry: '使用期限順',
  name: '名前順',
  category: 'カテゴリ順',
  added: '追加順',
}

const CATEGORY_ORDER_MAP: Record<string, number> = {
  冷蔵: 0, 冷凍: 1, 常温: 2,
  'トイレタリー': 0, '洗剤・クリーナー': 1, 'キッチン用品': 2, '衛生用品': 3,
  '食料・水': 0, '救急・医療': 1, '照明・電源': 2, '工具・避難用品': 3,
  'その他': 99,
}

function sortFoods(foods: Food[], key: SortKey): Food[] {
  return [...foods].sort((a, b) => {
    if (key === 'expiry') {
      if (!a.expiry_date && !b.expiry_date) return 0
      if (!a.expiry_date) return 1
      if (!b.expiry_date) return -1
      return a.expiry_date.localeCompare(b.expiry_date)
    }
    if (key === 'name') return a.name.localeCompare(b.name, 'ja')
    if (key === 'category') return (CATEGORY_ORDER_MAP[a.category] ?? 9) - (CATEGORY_ORDER_MAP[b.category] ?? 9)
    if (key === 'added') return b.created_at.localeCompare(a.created_at)
    return 0
  })
}

export default function Home() {
  const [foods, setFoods] = useState<Food[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [activeSection, setActiveSection] = useState<Section>('食材')
  const [activeCategory, setActiveCategory] = useState<string>('全て')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('expiry')
  const [showFilters, setShowFilters] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showTagManager, setShowTagManager] = useState(false)
  const [editingFood, setEditingFood] = useState<Food | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const [foodsSnap, tagsSnap] = await Promise.all([
        getDocs(query(collection(db, 'foods'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'tags'), orderBy('created_at', 'asc'))),
      ])
      const foodData = foodsSnap.docs.map((d) => {
        const raw = d.data()
        return { id: d.id, ...raw, tags: raw.tags ?? [], section: raw.section ?? '食材' } as Food
      })
      setFoods(foodData)
      setTags(tagsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Tag)))
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSectionChange = (s: Section) => {
    setActiveSection(s)
    setActiveCategory('全て')
    setActiveTag(null)
  }

  const sectionFoods = foods.filter((f) => (f.section ?? '食材') === activeSection)

  const filtered = sortFoods(
    sectionFoods
      .filter((f) => activeCategory === '全て' || f.category === activeCategory)
      .filter((f) => activeTag === null || f.tags?.includes(activeTag)),
    sortKey
  )

  const expiringCount = foods.filter((f) => {
    if (!f.expiry_date) return false
    const days = Math.ceil((new Date(f.expiry_date).getTime() - Date.now()) / 86400000)
    return days >= 0 && days <= 3
  }).length

  const activeFilterCount =
    (activeCategory !== '全て' ? 1 : 0) +
    (activeTag !== null ? 1 : 0) +
    (sortKey !== 'expiry' ? 1 : 0)

  const filterSummary = [
    activeCategory !== '全て' && activeCategory,
    activeTag && `#${activeTag}`,
    sortKey !== 'expiry' && SORT_LABELS[sortKey],
  ].filter(Boolean).join(' · ')

  const sectionCategories = SECTION_CATEGORIES[activeSection]

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-4 pt-4 pb-0 shadow-xl shadow-black/40">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">📦 ストック管理</h1>
              {expiringCount > 0 ? (
                <p className="text-xs text-amber-400 mt-0.5">⚠️ {expiringCount}品が3日以内に期限切れ</p>
              ) : (
                <p className="text-xs text-gray-600 mt-0.5">在庫をきちんと管理中</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTagManager(true)}
                className="text-xs text-gray-400 border border-gray-700 rounded-full px-3 py-1.5 hover:border-gray-600 transition-colors"
              >
                タグ管理
              </button>
              <span className="bg-gray-800 text-gray-300 text-sm font-semibold rounded-full px-3 py-1">
                {sectionFoods.length}品
              </span>
            </div>
          </div>

          {/* Section tabs */}
          <div className="flex gap-1">
            {SECTIONS.map((s) => {
              const count = foods.filter((f) => (f.section ?? '食材') === s).length
              const isActive = activeSection === s
              return (
                <button
                  key={s}
                  onClick={() => handleSectionChange(s)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                    isActive
                      ? 'border-emerald-500 text-white'
                      : 'border-transparent text-gray-600 hover:text-gray-400'
                  }`}
                >
                  <span>{SECTION_ICONS[s]}</span>
                  <span>{s}</span>
                  <span className={`text-xs rounded-full px-1.5 ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-600'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-3 pb-28">
        {/* Filter toggle bar */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 mb-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all"
        >
          <div className="flex items-center gap-2 min-w-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 flex-shrink-0">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            {activeFilterCount > 0 ? (
              <span className="text-xs text-emerald-400 truncate">{filterSummary}</span>
            ) : (
              <span className="text-xs text-gray-600">絞り込み・並び替え</span>
            )}
            {activeFilterCount > 0 && (
              <span className="flex-shrink-0 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-1.5 py-0.5 leading-none">
                {activeFilterCount}
              </span>
            )}
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={`text-gray-600 flex-shrink-0 transition-transform ${showFilters ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {/* Expandable filter panel */}
        {showFilters && (
          <div className="mb-3 bg-gray-900 border border-gray-800 rounded-xl p-3 flex flex-col gap-3">
            {/* Category */}
            <div>
              <p className="text-xs text-gray-600 mb-2">カテゴリ</p>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setActiveCategory('全て')}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeCategory === '全て'
                      ? 'bg-gray-200 text-gray-900'
                      : 'bg-gray-800 text-gray-500 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  全て
                </button>
                {sectionCategories.map((cat) => {
                  const count = sectionFoods.filter((f) => f.category === cat).length
                  const isActive = activeCategory === cat
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {cat}
                      <span className={`text-xs ${isActive ? 'text-emerald-400' : 'text-gray-600'}`}>{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-2">タグ</p>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setActiveTag(null)}
                    className={`px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      activeTag === null
                        ? 'bg-gray-200 text-gray-900'
                        : 'bg-gray-800 text-gray-500 border border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    すべて
                  </button>
                  {tags.map((tag) => {
                    const count = sectionFoods.filter((f) => f.tags?.includes(tag.name)).length
                    const isActive = activeTag === tag.name
                    return (
                      <button
                        key={tag.id}
                        onClick={() => setActiveTag(isActive ? null : tag.name)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-gray-800 text-gray-500 border border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        {tag.name}
                        <span className={`text-xs ${isActive ? 'text-emerald-400' : 'text-gray-600'}`}>{count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sort */}
            <div>
              <p className="text-xs text-gray-600 mb-2">並び替え</p>
              <div className="flex gap-1.5 flex-wrap">
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSortKey(key)}
                    className={`px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      sortKey === key
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-800 text-gray-500 border border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {SORT_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>

            {/* Push notification */}
            <div className="pt-1 border-t border-gray-800">
              <PushNotificationButton />
            </div>
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
            <div className="text-6xl mb-4">{SECTION_ICONS[activeSection]}</div>
            <p className="text-gray-400 font-medium">{activeSection}がありません</p>
            <p className="text-gray-600 text-sm mt-1">下の＋ボタンで追加しましょう</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filtered.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                onDeleted={(id) => setFoods((prev) => prev.filter((f) => f.id !== id))}
                onEdit={setEditingFood}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className={`fixed bottom-7 right-5 w-16 h-16 bg-gradient-to-br ${
          activeSection === '食材' ? 'from-emerald-500 to-teal-500 shadow-emerald-500/40' :
          activeSection === '日用品' ? 'from-blue-500 to-sky-400 shadow-blue-500/40' :
          'from-amber-500 to-orange-400 shadow-amber-500/40'
        } text-white text-3xl rounded-full shadow-xl flex items-center justify-center active:scale-95 hover:shadow-2xl transition-all`}
        aria-label={`${activeSection}を追加`}
      >
        +
      </button>

      {showModal && (
        <AddFoodModal
          section={activeSection}
          tags={tags}
          onAdded={(food) => setFoods((prev) => [food, ...prev])}
          onClose={() => setShowModal(false)}
        />
      )}

      {editingFood && (
        <EditFoodModal
          food={editingFood}
          tags={tags}
          onUpdated={(updated) => {
            setFoods((prev) => prev.map((f) => f.id === updated.id ? updated : f))
            setEditingFood(null)
          }}
          onClose={() => setEditingFood(null)}
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
