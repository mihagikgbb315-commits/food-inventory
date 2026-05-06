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

const defaultForm = {
  name: '',
  category: '冷蔵' as Category,
  quantity: 1,
  unit: '個',
  expiry_date: '',
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
    setForm((f) => ({ ...f, name }))
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
        onAdded({ id: ref.id, ...food, expiry_date: null, created_at: now, tags: selectedTags })
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
        quantity: form.quantity,
        unit: form.unit,
        expiry_date: form.expiry_date || null,
        created_at: now,
        tags: selectedTags,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-4 pt-4 pb-2 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">食材を追加</h2>
            <button onClick={onClose} className="text-gray-400 text-2xl leading-none">&times;</button>
          </div>
          <div className="flex rounded-lg bg-gray-100 p-1 gap-1">
            {(['manual', 'barcode', 'photo'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t ? 'bg-white shadow text-green-700' : 'text-gray-600'
                }`}
              >
                {t === 'manual' ? '手入力' : t === 'barcode' ? 'バーコード' : '写真認識'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {tab === 'barcode' && (
            <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setTab('manual')} />
          )}
          {tab === 'photo' && (
            <PhotoRecognizer onRecognized={handlePhotoRecognized} onClose={() => setTab('manual')} />
          )}
          {tab === 'manual' && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">食材名 *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="例：卵、鶏肉、牛乳"
                  className="w-full border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">保存場所</label>
                <div className="flex gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: cat }))}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        form.category === cat
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">タグ（任意・複数選択可）</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.name)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          selectedTags.includes(tag.name)
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-gray-600 border-gray-300'
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))}
                    className="w-full border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">単位</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">消費期限（任意）</label>
                <input
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-lg bg-green-600 text-white font-bold text-base disabled:opacity-50"
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
