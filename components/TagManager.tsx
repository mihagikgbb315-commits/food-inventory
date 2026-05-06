'use client'

import { useState } from 'react'
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { db, type Tag } from '@/lib/firebase'

type Props = {
  tags: Tag[]
  onTagsChanged: (tags: Tag[]) => void
  onClose: () => void
}

export default function TagManager({ tags, onTagsChanged, onClose }: Props) {
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name || tags.some((t) => t.name === name)) return
    setSaving(true)
    const now = new Date().toISOString()
    const ref = await addDoc(collection(db, 'tags'), { name, created_at: now })
    onTagsChanged([...tags, { id: ref.id, name, created_at: now }])
    setNewName('')
    setSaving(false)
  }

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`「${tag.name}」を削除しますか？`)) return
    await deleteDoc(doc(db, 'tags', tag.id))
    onTagsChanged(tags.filter((t) => t.id !== tag.id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-4 pt-4 pb-3 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">タグ管理</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="例：野菜、乳製品、肉類..."
              className="flex-1 border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleAdd}
              disabled={saving || !newName.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium disabled:opacity-40"
            >
              追加
            </button>
          </div>

          {tags.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              タグがありません。上の入力欄から追加してください。
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-700">{tag.name}</span>
                  <button
                    onClick={() => handleDelete(tag)}
                    className="text-gray-300 hover:text-red-500 text-xl leading-none transition-colors"
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
