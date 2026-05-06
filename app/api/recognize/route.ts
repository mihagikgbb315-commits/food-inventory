export const dynamic = 'force-dynamic'

import Anthropic from '@anthropic-ai/sdk'

const SUPPORTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type SupportedType = typeof SUPPORTED[number]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { imageBase64, mode } = body
    const rawType: string = body.mediaType ?? ''

    if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.length < 100) {
      return Response.json({ error: '画像データが取得できませんでした。もう一度試してください。' }, { status: 400 })
    }

    const safeType: SupportedType = (SUPPORTED as readonly string[]).includes(rawType)
      ? rawType as SupportedType
      : 'image/jpeg'

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const imageSource = {
      type: 'base64' as const,
      media_type: safeType,
      data: imageBase64,
    }

    if (mode === 'label') {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: imageSource },
            {
              type: 'text',
              text: `この商品パッケージやラベルに書かれている商品名を読み取ってください。
ブランド名を含む正式な商品名を1行だけ返してください。余分な説明は不要です。
例：「明治 おいしい牛乳」「カルビー ポテトチップス うすしお味」
商品名が読み取れない場合は空文字を返してください。`,
            },
          ],
        }],
      })
      const name = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
      return Response.json({ name: name || null })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: imageSource },
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
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return Response.json({ error: '食材を認識できませんでした' }, { status: 422 })

    return Response.json({ foods: JSON.parse(match[0]) })

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '認識に失敗しました'
    console.error('[recognize]', e)
    return Response.json({ error: msg }, { status: 500 })
  }
}
