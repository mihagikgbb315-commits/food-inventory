export const dynamic = 'force-dynamic'

import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  const { imageBase64, mediaType } = await request.json()
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType ?? 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `この画像を見て、写っている食材・食品・飲料・調味料をすべて識別してください。

以下のJSON配列のみを返してください。説明文や前置きは不要です。
[{"name":"食材名","category":"冷蔵 or 冷凍 or 常温","quantity":1,"unit":"個 or g or ml など"}]

ルール:
- nameは具体的な日本語名（例：「鶏もも肉」「牛乳」「玉ねぎ」「醤油」）
- categoryは保存場所の目安（冷蔵・冷凍・常温のいずれか）
- quantityは見えている数量（不明なら1）
- unitは適切な単位（個/本/袋/パック/g/kg/ml/L など）
- 食材が写っていない場合は空配列 [] を返す
- 食材かどうか判断できないものは含めない`,
          },
        ],
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const match = text.match(/\[[\s\S]*\]/)

  if (!match) {
    return Response.json({ error: '食材を認識できませんでした' }, { status: 422 })
  }

  const foods = JSON.parse(match[0])
  return Response.json({ foods })
}
