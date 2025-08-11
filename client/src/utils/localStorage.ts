export const LOCAL_STORAGE_KEYS = {
  INTERVIEW_SESSION_KEY: '@aivocate/interview-session-key',
}

export const clearAllKeys = () => localStorage.clear()

export const getLocalStorageKey = (key: string) => localStorage.getItem(key)

export const removeLocalStorageKey = (key: string) => localStorage.removeItem(key)

export const setLocalStorageKey = (key: string, value: string) => localStorage.setItem(key, value)
