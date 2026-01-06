'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { requestNotificationPermission, getNotificationPermission, sendNotification, isNotificationSupported } from './notifications'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [permission, setPermission] = useState('default')
  const [inAppNotifications, setInAppNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasAskedPermission, setHasAskedPermission] = useState(false)

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('iflare_notifications')
      const asked = localStorage.getItem('iflare_notification_asked')
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setInAppNotifications(parsed)
          setUnreadCount(parsed.filter(n => !n.read).length)
        } catch (e) {
          console.error('Error parsing notifications:', e)
        }
      }
      
      if (asked) {
        setHasAskedPermission(true)
      }

      if (isNotificationSupported()) {
        setPermission(Notification.permission)
      }
    }
  }, [])

  // Request permission
  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission()
    setPermission(granted ? 'granted' : 'denied')
    setHasAskedPermission(true)
    localStorage.setItem('iflare_notification_asked', 'true')
    return granted
  }, [])

  // Add a new notification
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    }

    setInAppNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 50) // Keep last 50
      localStorage.setItem('iflare_notifications', JSON.stringify(updated))
      return updated
    })

    setUnreadCount(prev => prev + 1)

    // Also send browser notification if permitted
    if (getNotificationPermission() === 'granted') {
      sendNotification(notification.title, {
        body: notification.body,
        url: notification.url
      })
    }

    return newNotification
  }, [])

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setInAppNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
      localStorage.setItem('iflare_notifications', JSON.stringify(updated))
      return updated
    })
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setInAppNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }))
      localStorage.setItem('iflare_notifications', JSON.stringify(updated))
      return updated
    })
    setUnreadCount(0)
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setInAppNotifications([])
    setUnreadCount(0)
    localStorage.removeItem('iflare_notifications')
  }, [])

  // Notify about new matching iFlare
  const notifyNewFlare = useCallback((flare, matchedInterests) => {
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
    
    addNotification({
      type: 'new_flare',
      title: `${emoji} New iFlare matches your interests!`,
      body: flare.title,
      description: flare.description,
      flareId: flare.id,
      url: '/flares',
      matchedInterests
    })
  }, [addNotification])

  const value = {
    permission,
    hasAskedPermission,
    inAppNotifications,
    unreadCount,
    requestPermission,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    notifyNewFlare
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider')
  }
  return context
}
