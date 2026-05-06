export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  if (!code) return Response.json({ error: 'code is required' }, { status: 400 })

  // Try Open Food Facts first
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`,
      { headers: { 'User-Agent': 'FoodInventoryApp/1.0' }, signal: AbortSignal.timeout(5000) }
    )
    const data = await res.json()
    if (data.status === 1 && data.product) {
      const p = data.product
      const name =
        p.product_name_ja ||
        p.product_name ||
        p.abbreviated_product_name ||
        p.generic_name_ja ||
        p.generic_name ||
        (p.brands ? p.brands.split(',')[0].trim() : null)
      if (name?.trim()) return Response.json({ name: name.trim() })
    }
  } catch { /* fall through */ }

  // Fallback: UPC Item DB (100 req/day free)
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(code)}`,
      { headers: { 'User-Agent': 'FoodInventoryApp/1.0' }, signal: AbortSignal.timeout(5000) }
    )
    const data = await res.json()
    if (data.code === 'OK' && data.items?.[0]) {
      const item = data.items[0]
      const name = item.title || item.brand || null
      if (name?.trim()) return Response.json({ name: name.trim() })
    }
  } catch { /* fall through */ }

  return Response.json({ name: null })
}
