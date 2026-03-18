import { useState, useCallback } from 'react'

function parseProduct(product) {
  if (!product) return null
  const nutriments = product.nutriments || {}
  return {
    barcode: product.code || product._id,
    name: product.product_name || product.product_name_es || product.generic_name || 'Producto desconocido',
    brand: product.brands || '',
    image_url: product.image_front_small_url || product.image_small_url || product.image_url || null,
    serving_size: product.serving_size || '100g',
    calories_per_100g: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
    protein_g: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
    carbs_g: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
    fat_g: Math.round((nutriments.fat_100g || 0) * 10) / 10,
    fiber_g: Math.round((nutriments.fiber_100g || 0) * 10) / 10,
  }
}

export function useFoodSearch() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const searchByName = useCallback(async (query) => {
    if (!query?.trim()) return
    setLoading(true)
    setError(null)
    setResults([])
    try {
      const params = new URLSearchParams({
        search_terms: query.trim(),
        search_simple: '1',
        action: 'process',
        json: '1',
        page_size: '20',
        fields: 'code,product_name,product_name_es,generic_name,brands,nutriments,image_front_small_url,serving_size',
      })
      const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`)
      if (!res.ok) throw new Error('Error de red')
      const data = await res.json()
      const parsed = (data.products || [])
        .map(p => parseProduct(p))
        .filter(p => p && p.name && p.name !== 'Producto desconocido')
      setResults(parsed)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const searchByBarcode = useCallback(async (code) => {
    if (!code) return null
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`)
      if (!res.ok) throw new Error('Error de red')
      const data = await res.json()
      if (data.status !== 1) {
        setError('Producto no encontrado')
        return null
      }
      const product = parseProduct({ ...data.product, code })
      setResults(product ? [product] : [])
      return product
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const clearResults = () => { setResults([]); setError(null) }

  const injectResults = useCallback((items) => {
    setResults(items)
    setError(null)
  }, [])

  return { results, loading, error, searchByName, searchByBarcode, clearResults, injectResults }
}
