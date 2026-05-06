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
            text: `この画像に写っている食材を識別してください。
食材ごとに以下のJSON配列で返してください。他のテキストは不要です。
[{"name":"食材名","category":"冷蔵 or 冷凍 or 常温","quantity":1,"unit":"個 or g or ml など"}]

- nameは日本語で
- categoryは冷蔵・冷凍・常温のいずれか
- quantityは目視できる数量（不明なら1）
- unitは適切な単位`,
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
