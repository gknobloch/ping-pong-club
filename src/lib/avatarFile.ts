// Turn a picked image File into the square 256px JPEG (base64) the avatar
// endpoint stores — the web counterpart of the mobile expo-image-manipulator
// thumbnail. Center-crops to a square so portraits/landscapes both fill.
const AVATAR_SIZE = 256

export async function fileToAvatar(file: File): Promise<{ base64: string; contentType: string }> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas non disponible')

  const scale = Math.max(AVATAR_SIZE / bitmap.width, AVATAR_SIZE / bitmap.height)
  const w = bitmap.width * scale
  const h = bitmap.height * scale
  ctx.drawImage(bitmap, (AVATAR_SIZE - w) / 2, (AVATAR_SIZE - h) / 2, w, h)
  bitmap.close?.()

  const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
  return { base64: dataUrl.split(',')[1] ?? '', contentType: 'image/jpeg' }
}
