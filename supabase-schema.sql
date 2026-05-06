-- Supabaseのダッシュボード > SQL Editor で実行してください

CREATE TABLE foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('冷蔵', '冷凍', '常温')),
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT '',
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 誰でも読み書きできるようにする（家族共有用）
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON foods FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON push_subscriptions FOR ALL USING (true) WITH CHECK (true);
