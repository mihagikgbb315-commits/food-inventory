'use client'

import { useState } from 'react'
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { db, type Tag, type Section } from '@/lib/firebase'

const SECTIONS: Section[] = ['食材', '日用品', '防災用品']

type Props = {
  tags: Tag[]
  activeSection: Section
  onTagsChanged: (tags: Tag[]) => void
  onClose: () => void
}

export default function TagManager({ tags, activeSection, onTagsChanged, onClose }: Props) {
  const [tab, setTab] = useState<Section>(activeSection)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  const sectionTags = tags.filter((t) => (t.section ?? '食材') === tab)

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name || sectionTags.some((t) => t.name === name)) return
    setSaving(true)
    const now = new Date().toISOString()
    const ref = await addDoc(collection(db, 'tags'), { name, section: tab, created_at: now })
    onTagsChanged([...tags, { id: ref.id, name, section: tab, created_at: now }])
    setNewName('')
    setSaving(false)
  }

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`「${tag.name}」を削除しますか？`)) return
    await deleteDoc(doc(db, 'tags', tag.id))
    onTagsChanged(tags.filter((t) => t.id !== tag.id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-700 rounded-full" />
        </div>

        <div className="sticky top-0 bg-gray-900 px-5 pt-4 pb-3 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">タグ管理</h2>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-400 text-2xl leading-none transition-colors">&times;</button>
          </div>
          <div className="flex gap-1">
            {SECTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setTab(s); setNewName('') }}
                className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-all ${
                  tab === s
                    ? 'border-emerald-500 text-white'
                    : 'border-transparent text-gray-600 hover:text-gray-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder={tab === '食材' ? '例：野菜、肉類、乳製品...' : tab === '日用品' ? '例：消耗品、掃除用品...' : '例：3日分、7日分...'}
              className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            <button
              onClick={handleAdd}
              disabled={saving || !newName.trim()}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold disabled:opacity-40 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98] transition-all"
            >
              追加
            </button>
          </div>

          {sectionTags.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 text-sm">{tab}のタグがありません</p>
              <p className="text-gray-700 text-xs mt-1">上の入力欄から追加してください</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sectionTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl"
                >
                  <span className="text-sm font-medium text-gray-200">{tag.name}</span>
                  <button
                    onClick={() => handleDelete(tag)}
                    className="text-gray-600 hover:text-red-400 text-xl leading-none transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
