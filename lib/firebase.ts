import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const db = getFirestore(app)

export type Section = '食材' | '日用品' | '防災用品'

export const SECTION_CATEGORIES: Record<Section, string[]> = {
  食材: ['冷蔵', '冷凍', '常温'],
  日用品: ['トイレタリー', '洗剤・クリーナー', 'キッチン用品', '衛生用品', 'その他'],
  防災用品: ['食料・水', '救急・医療', '照明・電源', '工具・避難用品', 'その他'],
}

export const SECTION_UNITS: Record<Section, string[]> = {
  食材: ['個', 'g', 'kg', 'ml', 'L', '本', '袋', '枚', 'パック', '缶'],
  日用品: ['個', '本', '袋', 'セット', '箱', 'ロール', 'ケース', '枚'],
  防災用品: ['個', '本', '袋', 'セット', '箱', 'L', '缶', '枚', 'kg'],
}

// kept for backward compat
export type Category = '冷蔵' | '冷凍' | '常温'

export type Tag = {
  id: string
  name: string
  created_at: string
}

export type Food = {
  id: string
  section: Section
  name: string
  category: string
  quantity: number
  unit: string
  expiry_date: string | null
  created_at: string
  tags: string[]
  memo: string
}
