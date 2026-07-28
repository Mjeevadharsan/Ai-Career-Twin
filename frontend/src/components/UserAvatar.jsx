import React, { useState, useEffect } from 'react'

export default function UserAvatar({ email, name, size = 36, className = '', style = {} }) {
  const cleanEmail = (email || '').trim().toLowerCase()
  const displayName = name || (cleanEmail ? cleanEmail.split('@')[0] : 'User')
  
  // Unavatar API fetches public Google profile pictures for Gmail addresses, Gravatar & GitHub
  const primaryAvatar = cleanEmail ? `https://unavatar.io/${encodeURIComponent(cleanEmail)}` : null
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=ffffff&bold=true&size=${size * 2}`

  const [src, setSrc] = useState(primaryAvatar || fallbackAvatar)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (cleanEmail) {
      setSrc(`https://unavatar.io/${encodeURIComponent(cleanEmail)}`)
      setFailed(false)
    } else {
      setSrc(fallbackAvatar)
    }
  }, [cleanEmail, displayName])

  const onError = () => {
    if (!failed) {
      setFailed(true)
      setSrc(fallbackAvatar)
    }
  }

  return (
    <img
      src={src}
      alt={displayName}
      onError={onError}
      className={`user-avatar-img ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0,
        border: '1.5px solid rgba(255, 255, 255, 0.2)',
        backgroundColor: '#0f172a',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        ...style
      }}
      title={`${displayName} ${cleanEmail ? `(${cleanEmail})` : ''}`}
    />
  )
}
