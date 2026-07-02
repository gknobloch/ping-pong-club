import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// Round club logo (web). Mirrors Avatar.tsx's fetch-as-blob approach for
// consistency, even though the logo endpoint is public. Falls back to the
// club's initial when there's no logo (or the fetch fails). Mirrors
// mobile/components/ClubLogo.tsx.
export function ClubLogo({
  clubId,
  logoUpdatedAt,
  name,
  size = 48,
  className = '',
}: {
  clubId: string
  logoUpdatedAt?: string
  name?: string
  size?: number
  className?: string
}) {
  const { token } = useAuth()
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!logoUpdatedAt) {
      setUrl(null)
      return
    }
    let active = true
    let objectUrl: string | null = null
    fetch(`/api/clubs/${clubId}/logo?v=${encodeURIComponent(logoUpdatedAt)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((blob) => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {
        if (active) setUrl(null)
      })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [clubId, logoUpdatedAt, token])

  const box = { width: size, height: size }

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white ${className}`}
      style={box}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-contain" />
      ) : (
        <span className="font-bold text-slate-400" style={{ fontSize: Math.round(size * 0.4) }}>
          {name?.[0]?.toUpperCase() ?? '?'}
        </span>
      )}
    </div>
  )
}
