import { useEffect, useState } from 'react'

interface StorageAccessInfo {
  hasStorageAccessSupported: boolean
  requestStorageAccessSupported: boolean
  requestStorageAccessForSupported: boolean
  currentHasAccess: boolean | null
  userAgent: string
}

export function useStorageAccessInfo(): StorageAccessInfo {
  const [info, setInfo] = useState<StorageAccessInfo>({
    hasStorageAccessSupported: false,
    requestStorageAccessSupported: false,
    requestStorageAccessForSupported: false,
    currentHasAccess: null,
    userAgent: '',
  })

  useEffect(() => {
    const hasStorageAccessSupported =
      typeof document.hasStorageAccess === 'function'
    const requestStorageAccessSupported =
      typeof document.requestStorageAccess === 'function'
    const requestStorageAccessForSupported =
      typeof document.requestStorageAccessFor === 'function'

    const update = (currentHasAccess: boolean | null) => {
      setInfo({
        hasStorageAccessSupported,
        requestStorageAccessSupported,
        requestStorageAccessForSupported,
        currentHasAccess,
        userAgent: navigator.userAgent,
      })
    }

    if (hasStorageAccessSupported) {
      document.hasStorageAccess().then(
        (result) => update(result),
        () => update(null),
      )
    } else {
      update(null)
    }
  }, [])

  return info
}
