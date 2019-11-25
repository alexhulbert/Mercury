import { MercuryIODevice } from '../devices/interface'
import { Cond, State } from './state'
import { Key, ROOT_FOLDER_NAME } from './index'
import Utils from './utils'

// This is the normalized folder map passed in by ./index.ts
type FolderMap = Record<string, Folder>
// A map from keys to KeyUp/KeyDown functions
type BindFnMap = Record<Key, Partial<Record<'up' | 'down', Function>>>
// A map from keys to character codes
type IconMap = Record<Key, number>

// Same as index.ts, except that the KeyMap type is slightly different
export interface Folder {
  name: string
  binds: KeyMap
  isModifier?: boolean
}

// Same as index.ts, except that `binds` only maps from keys to actions
// In index.ts, `binds` can map to an alias and the `Action` type is different
type KeyMap = Record<Key, Action>

// Same as index.ts, except that folder only refers to the name of a subfolder
// and not the actual content of that folder
interface Action {
  icon: Cond<string>
  keepFolderOpen?: boolean
  command?: Cond<Function>
  folder?: string
}

// Router class. This handles all the folder switching and command binding
export default class {
  // A trail of currently opened folders
  // BackKey refers to the key used to enter/undo that specific folder
  openFolders: Array<{ name: string, backKey?: string}> = []
  // A state class that allows third-party code to change the shortcuts
  // See ./state.ts and ./state-hooks/*
  state = new State()

  // Accepts a list of already initialized devices and a folder map
  constructor(public devices: MercuryIODevice[], public folders: FolderMap) {
    // When the state changes, reload the functions/icons bound to each key
    this.state.onRefresh(() => this.refresh())
    // Initialize with the root folder
    this.openFolder(ROOT_FOLDER_NAME)
  }

  // Reloads all the icons/buttons on screen
  private refresh() {
    // TODO: Replace this with code that actually works
    // const currentFolderLevel = this.openFolders.length - 1
    // this.navigateBack(currentFolderLevel)
  }

  // Opens a new folder on top of the current keybinds
  private openFolder(name: string, backKey?: string) {
    // Push the new folder to the open folder stack
    this.openFolders.push({ name: name, backKey })
    // Calculate the new bound functions and icons to apply
    const newBindFns = this.createBindFns(this.openFolders.length - 1)
    const newIcons = this.createIconMap(this.openFolders.length - 1)
    // Register these changes with the connected devices
    this.pushChanges(name, newBindFns, newIcons)
  }

  // Undoes one or more open folders
  private navigateBack(folderLevel: number) {
    // The new innermost folder to show
    // Anything bound after this folder must be rebound
    // Anything bound before this folder does not need to be rebound
    const destHistoryRecord = this.openFolders[folderLevel]

    // Calculate the total state of all bound functions and icons at folderLevel
    let totalBindFns = {}
    let totalIcons = {}
    // Start at the first folder and successively merge on functions/icons
    for (let i = 0; i <= folderLevel; i++) {
      totalBindFns = { ...totalBindFns, ...this.createBindFns(i) }
      totalIcons = { ...totalIcons, ...this.createIconMap(i) }
    }

    // Calculate which keys actually need to be rebound
    const keysToChange: Key[] = []
    for (let i = folderLevel + 1; i < this.openFolders.length; i++) {
      const modifiedKeys = Utils.keys(this.createBindFns(i))
      keysToChange.push(...modifiedKeys.filter(k => !keysToChange.includes(k)))
    }
    
    // Generate new objects which have the same mappings as totalBindFns and
    // totalIcons, but only containing the keys in keysToChange
    const targetBindFns = {}
    const targetIcons = {}
    for (const key of keysToChange) {
      if (totalBindFns[key] || totalIcons[key]) {
        // If the key that needs to be changed had a function/icon set at
        // folderLevel, then add that new function/icon to the target map
        targetBindFns[key] = totalBindFns[key]
        targetIcons[key] = totalIcons[key]
      } else {
        // If the key needs to be changed, but it wasn't bound to anything at
        // folderLevel, then unbind and clear out the icon for that key
        this.getDeviceByKey(key).unbindKey(key)
        targetIcons[key] = 0
      }
    }

    // Remove all open folder records after folder level since now folderLevel
    // is the innermost open folder
    this.openFolders.splice(folderLevel + 1)
    // Register the new binds/icons defined in targetBindFns and targetIcons
    // This function also registers the new folder name 
    this.pushChanges(destHistoryRecord.name, targetBindFns, targetIcons)
  }

  // Given the index of a folder recorded in this.openFolders, generates the
  // key binding functions that should be applied when that folder is entered
  private createBindFns(folderLevel: number) {
    // Get all the required data about the folder
    const { name: folderName, backKey } = this.openFolders[folderLevel]
    const { isModifier, binds } = this.folders[folderName]
    // This will hold the binding functions
    const bindFnMap: BindFnMap = {}
    
    // When the back key is pressed/released, close this folder
    // along with everything that was opened after it
    if (backKey && folderLevel) {
      // If folder.isModifier, close folder(s) on KeyUp, otherwise KeyDown
      const event = isModifier ? 'up' : 'down'
      bindFnMap[backKey] = { [event]: () => this.navigateBack(folderLevel - 1) }
    }

    // Loops through each binding of the folder that
    // binding functions are being generated for
    for (const key of Utils.keys(binds)) {
      const action = binds[key]
      // Clears KeyUp event by replacing it with a no-op function
      bindFnMap[key] = {
        up: () => {},
        down: () => {
          // If there is a command associated with the action, run it
          const commandFn = this.state.resolveConditional(action.command)
          if (commandFn) commandFn()
          if (action.folder) {
            // If the action has a subfolder, open that folder
            this.openFolder(action.folder, key)
          } else if (!action.keepFolderOpen) {
            // If a command was executed, close the folder
            // (unless otherwise specified)
            this.navigateBack(0)
          }
        }
      }
    }

    return bindFnMap
  }

  // Given the index of a folder recorded in this.openFolders,
  // generates a map of keys to unicode character codes
  private createIconMap(folderLevel: number) {
    const { name: folderName } = this.openFolders[folderLevel]
    const folder = this.folders[folderName]
    const iconMap: Record<Key, number> = {}

    for (const key of Utils.keys(folder.binds)) {
      // Resolve the correct icon by checking it against the state
      const iconHex = this.state.resolveConditional(folder.binds[key].icon)
      // Convert the hex string into a number and add it to the icon map
      iconMap[key] = parseInt(iconHex, 16)
    }

    return iconMap
  }

  // Pushes a new mode name, new binding functions, and new icons
  // with all the devices connected to this instance of the router class
  private pushChanges(name: string, newBindFns: BindFnMap, newIcons: IconMap) {
    // Register all functions defined in newBindFns with their associated device
    for (const key of Utils.keys(newBindFns)) {
      const device = this.getDeviceByKey(key)
      if (newBindFns[key].down) device.onKeyDown(key, newBindFns[key].down)
      if (newBindFns[key].up) device.onKeyUp(key, newBindFns[key].up)
    }

    for (const device of this.devices) {
      // Display all icons defined in newIcons
      device.folderEntered(name || null)
      // Notify all devices that folder name has been changed
      device.displayChars(newIcons)
    }
  }

  // Determines which device is associated with a given key
  private getDeviceByKey(key: Key) {
    const device = this.devices.find(dev => dev.isKeyFromDevice(key))
    if (!device) {
      console.error(`Error: Key "${String(key)}" not found`)
      process.exit(1)
    }
    return device
  }
}