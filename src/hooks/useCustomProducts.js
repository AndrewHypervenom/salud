import { useCallback } from 'react'
import { supabase } from '../lib/supabase'

function normalizeRow(row) {
  if (!row) return null
  return {
    id: row.id,
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

async function uploadProductImage(barcode, file) {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `products/${barcode}/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('food-images')
    .upload(path, file, { contentType: file.type, upsert: true })
  if (error) return null
  const { data } = supabase.storage.from('food-images').getPublicUrl(path)
  return data.publicUrl
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
      productImageUrl = await uploadProductImage(barcode, productImageFile)
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

  const listByProfile = useCallback(async (profileId) => {
    if (!profileId) return []
    const { data, error } = await supabase
      .from('custom_products')
      .select('*')
      .eq('contributed_by', profileId)
      .order('updated_at', { ascending: false })
    if (error || !data) return []
    return data.map(normalizeRow)
  }, [])

  const updateProduct = useCallback(async (id, barcode, updates, productImageFile) => {
    let productImageUrl
    if (productImageFile && barcode) {
      productImageUrl = await uploadProductImage(barcode, productImageFile)
    }

    const record = {
      name: updates.name,
      brand: updates.brand || null,
      calories_per_100g: Number(updates.calories_per_100g) || 0,
      protein_g: Number(updates.protein_g) || 0,
      carbs_g: Number(updates.carbs_g) || 0,
      fat_g: Number(updates.fat_g) || 0,
      updated_at: new Date().toISOString(),
      ...(productImageUrl && { product_image_url: productImageUrl }),
    }

    const { error } = await supabase
      .from('custom_products')
      .update(record)
      .eq('id', id)

    if (error) throw error
  }, [])

  const deleteProduct = useCallback(async (id) => {
    const { error } = await supabase
      .from('custom_products')
      .delete()
      .eq('id', id)
    if (error) throw error
  }, [])

  return { searchByBarcode, searchByName, saveProduct, listByProfile, updateProduct, deleteProduct }
}
