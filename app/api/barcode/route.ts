export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  if (!code) return Response.json({ error: 'code is required' }, { status: 400 })

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`,
      { headers: { 'User-Agent': 'FoodInventoryApp/1.0' } }
    )
    const data = await res.json()

    if (data.status !== 1 || !data.product) {
      return Response.json({ name: null })
    }

    const p = data.product
    const name =
      p.product_name_ja ||
      p.product_name_en ||
      p.product_name ||
      p.abbreviated_product_name ||
      null

    return Response.json({ name: name?.trim() || null })
  } catch {
    return Response.json({ name: null })
  }
}
