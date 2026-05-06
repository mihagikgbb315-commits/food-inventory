'use client'

import { useState } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db, type Category, type Food, type Tag } from '@/lib/firebase'
import BarcodeScanner from './BarcodeScanner'
import PhotoRecognizer from './PhotoRecognizer'

type Props = {
  tags: Tag[]
  onAdded: (food: Food) => void
  onClose: () => void
}

type Tab = 'manual' | 'barcode' | 'photo'

const CATEGORIES: Category[] = ['冷蔵', '冷凍', '常温']
const UNITS = ['個', 'g', 'kg', 'ml', 'L', '本', '袋', '枚', 'パック', '缶']

const CATEGORY_ACTIVE: Record<string, string> = {
  冷蔵: 'from-blue-500 to-cyan-400',
  冷凍: 'from-violet-500 to-indigo-400',
  常温: 'from-amber-500 to-orange-400',
}

const defaultForm = {
  name: '',
  category: '冷蔵' as Category,
  quantity: '' as number | '',
  unit: '個',
  expiry_date: '',
  memo: '',
}

export default function AddFoodModal({ tags, onAdded, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('manual')
  const [form, setForm] = useState(defaultForm)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleTag = (name: string) =>
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    )

  const handleBarcodeDetected = (name: string) => {
    setTab('manual')
    setForm((f) => ({ ...f, name: name || '' }))
  }

  const handlePhotoRecognized = async (
    foods: { name: string; category: Category; quantity: number; unit: string }[]
  ) => {
    if (foods.length === 0) return
    setSaving(true)
    setError(null)
    try {
      for (const food of foods) {
        const now = new Date().toISOString()
        const ref = await addDoc(collection(db, 'foods'), {
          ...food,
          expiry_date: null,
          created_at: now,
          tags: selectedTags,
        })
        onAdded({ id: ref.id, ...food, expiry_date: null, created_at: now, tags: selectedTags, memo: '' })
      }
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const now = new Date().toISOString()
      const data = {
        name: form.name.trim(),
        category: form.category,
        quantity: form.quantity === '' ? 0 : form.quantity,
        unit: form.unit,
        expiry_date: form.expiry_date || null,
        created_at: now,
        tags: selectedTags,
        memo: form.memo.trim(),
      }
      const ref = await addDoc(collection(db, 'foods'), data)
      onAdded({ id: ref.id, ...data })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-gray-900 px-5 pt-4 pb-3 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">食材を追加</h2>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-400 text-2xl leading-none transition-colors">&times;</button>
          </div>
          <div className="flex rounded-xl bg-gray-800 p-1 gap-1">
            {(['manual', 'barcode', 'photo'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t === 'manual' ? '手入力' : t === 'barcode' ? 'バーコード' : '写真認識'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {tab === 'barcode' && (
            <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setTab('manual')} />
          )}
          {tab === 'photo' && (
            <PhotoRecognizer onRecognized={handlePhotoRecognized} onClose={() => setTab('manual')} />
          )}
          {tab === 'manual' && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">食材名</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="例：卵、鶏肉、牛乳"
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">保存場所</label>
                <div className="flex gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: cat }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        form.category === cat
                          ? `bg-gradient-to-r ${CATEGORY_ACTIVE[cat]} text-white shadow-md`
                          : 'bg-gray-800 text-gray-500 border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {tags.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">タグ（複数可）</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.name)}
                        className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                          selectedTags.includes(tag.name)
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-gray-800 text-gray-500 border border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">数量</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">単位</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">消費期限（任意）</label>
                  {form.expiry_date && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, expiry_date: '' }))}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                    >
                      クリア
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">メモ（任意）</label>
                <textarea
                  value={form.memo}
                  onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                  placeholder="例：開封済み、塩分控えめ、冷凍前に下処理済み..."
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base disabled:opacity-40 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98] transition-all"
              >
                {saving ? '保存中...' : '追加する'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
