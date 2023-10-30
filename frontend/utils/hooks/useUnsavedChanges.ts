import router from 'next/router'
import { useEffect, useState } from 'react'

export type UnsavedChangesHook = {
  unsavedChanges: boolean
  setUnsavedChanges: (newValue: boolean) => void
  sendWarning: () => boolean
}

export default function useUnsavedChanges(): UnsavedChangesHook {
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  const warningText = 'Any unsaved changes will be lost - are you sure you wish to leave this page?'

  useEffect(() => {
    const handleWindowClose = (e) => {
      if (!unsavedChanges) return
      e.preventDefault()
      return (e.returnValue = warningText)
    }
    const handleBrowseAway = () => {
      if (!unsavedChanges) return
      if (window.confirm(warningText)) return
      router.events.emit('routeChangeError')
      throw 'routeChange aborted.'
    }
    window.addEventListener('beforeunload', handleWindowClose)
    router.events.on('routeChangeStart', handleBrowseAway)
    return () => {
      window.removeEventListener('beforeunload', handleWindowClose)
      router.events.off('routeChangeStart', handleBrowseAway)
    }
  }, [unsavedChanges])

  const sendWarning = () => {
    return window.confirm(warningText)
  }

  return {
    unsavedChanges,
    setUnsavedChanges,
    sendWarning,
  }
}
