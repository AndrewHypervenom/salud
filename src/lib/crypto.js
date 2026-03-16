/**
 * Hash a text string using SHA-256 via native crypto.subtle.
 * Used for both PIN digits and recovery word.
 * @param {string} text
 * @returns {Promise<string>} hex digest
 */
export async function hashPin(text) {
  const encoder = new TextEncoder()
  const data = encoder.encode(String(text))
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify text against a stored SHA-256 hex hash.
 * @param {string} text
 * @param {string} hash - stored hex SHA-256
 * @returns {Promise<boolean>}
 */
export async function verifyPin(text, hash) {
  const computed = await hashPin(text)
  return computed === hash
}
