'use client'

import { useEffect, useState } from 'react'

// Check if notifications are supported
export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window
}

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.log('Notifications not supported')
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return false
  }
}

// Get current notification permission status
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

// Send a browser notification
export const sendNotification = (title, options = {}) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null
  }

  const defaultOptions = {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    tag: 'iflare-notification',
    renotify: true,
    ...options
  }

  try {
    const notification = new Notification(title, defaultOptions)
    
    notification.onclick = () => {
      window.focus()
      if (options.url) {
        window.location.href = options.url
      }
      notification.close()
    }

    return notification
  } catch (error) {
    console.error('Error sending notification:', error)
    return null
  }
}

// Hook to manage notifications
export const useNotifications = () => {
  const [permission, setPermission] = useState('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported(isNotificationSupported())
    if (isNotificationSupported()) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    const granted = await requestNotificationPermission()
    setPermission(granted ? 'granted' : 'denied')
    return granted
  }

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification
  }
}

// Notify about new iFlare
export const notifyNewFlare = (flare) => {
  if (getNotificationPermission() !== 'granted') return

  const interestEmoji = {
    sports: '🏃',
    music: '🎵',
    food: '🍕',
    art: '🎨',
    tech: '💻',
    outdoor: '🏕️',
    nightlife: '🌙',
    wellness: '🧘',
    learning: '📚',
    social: '☕',
    pets: '🐕',
    travel: '✈️'
  }

  const emoji = interestEmoji[flare.interests?.[0]] || '🔥'

  sendNotification(`${emoji} New iFlare: ${flare.title}`, {
    body: `${flare.description}\n📍 ${flare.location?.name || 'Location TBD'}`,
    url: '/flares',
    data: { flareId: flare.id }
  })
}
