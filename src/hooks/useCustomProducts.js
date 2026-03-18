import { useCallback } from 'react'
import { supabase } from '../lib/supabase'

function normalizeRow(row) {
  if (!row) return null
  return {
    barcode: row.barcode,
    name: row.name,
    brand: row.brand || '',
    image_url: row.product_image_url || null,
    serving_size: row.serving_size || '100g',
    calories_per_100g: Number(row.calories_per_100g) || 0,
    protein_g: Number(row.protein_g) || 0,
    carbs_g: Number(row.carbs_g) || 0,
    fat_g: Number(row.fat_g) || 0,
    fiber_g: row.fiber_g != null ? Number(row.fiber_g) : null,
    source: 'local',
  }
}

export function useCustomProducts() {
  const searchByBarcode = useCallback(async (barcode) => {
    if (!barcode) return null
    const { data, error } = await supabase
      .from('custom_products')
      .select('*')
      .eq('barcode', barcode)
      .maybeSingle()
    if (error || !data) return null
    return normalizeRow(data)
  }, [])

  const searchByName = useCallback(async (query) => {
    if (!query?.trim()) return []
    const { data, error } = await supabase
      .from('custom_products')
      .select('*')
      .ilike('name', `%${query.trim()}%`)
      .limit(20)
    if (error || !data) return []
    return data.map(normalizeRow)
  }, [])

  const saveProduct = useCallback(async ({
    barcode, name, brand, calories_per_100g, protein_g, carbs_g, fat_g,
    fiber_g, serving_size, productImageFile, contributedBy,
  }) => {
    let productImageUrl = null

    if (productImageFile && barcode) {
      const ext = productImageFile.name.split('.').pop() || 'jpg'
      const path = `products/${barcode}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('food-images')
        .upload(path, productImageFile, { contentType: productImageFile.type, upsert: true })
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('food-images').getPublicUrl(path)
        productImageUrl = urlData.publicUrl
      }
    }

    const record = {
      barcode,
      name,
      brand: brand || null,
      serving_size: serving_size || '100g',
      calories_per_100g: Number(calories_per_100g) || 0,
      protein_g: Number(protein_g) || 0,
      carbs_g: Number(carbs_g) || 0,
      fat_g: Number(fat_g) || 0,
      fiber_g: fiber_g != null ? Number(fiber_g) : null,
      updated_at: new Date().toISOString(),
      ...(contributedBy && { contributed_by: contributedBy }),
      ...(productImageUrl && { product_image_url: productImageUrl }),
    }

    const { error } = await supabase
      .from('custom_products')
      .upsert(record, { onConflict: 'barcode' })

    if (error) throw error
    return record
  }, [])

  return { searchByBarcode, searchByName, saveProduct }
}
