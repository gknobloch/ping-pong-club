import * as ImagePicker from 'expo-image-picker'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'

// Avatars are stored base64 in D1, so keep them small: a square 256px JPEG
// thumbnail (~15–40 KB).
const AVATAR_SIZE = 256

export interface ProcessedAvatar {
  base64: string
  contentType: string
}

async function toThumbnail(uri: string): Promise<ProcessedAvatar> {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: AVATAR_SIZE, height: AVATAR_SIZE } }],
    { compress: 0.7, format: SaveFormat.JPEG, base64: true },
  )
  return { base64: result.base64 ?? '', contentType: 'image/jpeg' }
}

/** Pick a photo from the library, square-cropped and downscaled. Null if cancelled/denied. */
export async function pickAvatarFromLibrary(): Promise<ProcessedAvatar | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!perm.granted) return null
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  })
  if (res.canceled || !res.assets?.[0]) return null
  return toThumbnail(res.assets[0].uri)
}

/** Take a photo with the camera, square-cropped and downscaled. Null if cancelled/denied. */
export async function takeAvatarPhoto(): Promise<ProcessedAvatar | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync()
  if (!perm.granted) return null
  const res = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  })
  if (res.canceled || !res.assets?.[0]) return null
  return toThumbnail(res.assets[0].uri)
}
