// Each key must be a symbol or unique string
export type Key = symbol | string
export interface MercuryIODevice {
  // Should return true if `key` is associated with this device
  isKeyFromDevice(key: Key): boolean

  // Resolves when the device is initialized
  // If this isn't present, it is assumed that the device is initialized
  initialize?(): Promise<void>

  // Should run fn when `key` is pushed
  onKeyDown(key: Key, fn: Function)
  // Should run fn when `key` is released
  onKeyUp(key: Key, fn: Function)
  // Should unbind up, down, and press functions for `key`
  unbindKey(key: Key)

  // Display characters in positions associated with each key
  // Takes a map where keys are physically pressed keys and values are charCodes
  displayChars(keyCodes: Record<Key, number>)
  // Resets the device to its initial state
  reset()

  // Called when a folder is entered. Uses folder name '' for root
  folderEntered?(folderName: string)
}