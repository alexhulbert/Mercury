import { MercuryIODevice } from '../devices/interface'
import { Cond } from './state'
import Utils from './utils'
import Router, { Folder as RouterFolder } from './router'

// Application configuration file. Contains everything needed to start server
export interface Config {
  devices: MercuryIODevice[],
  binds: KeyMap
}

// A string or symbol representing a button, keyboard key, etc. on a device
// This should really be type `string | symbol`, but TypeScript has issues
// with using symbols as JSON keys
export type Key = any
// A map from keys to actions. In the config file, keys can be mapped to
// either commands, folders, or aliases
export type KeyMap = Record<Key, Action | Alias>

// An action is anything that happens when a key is pressed
// It can either be a command (a function to execute) or a folder of keybindings
// Folders can either be of type Folder or the name of another folder
// Cond<T> can be a map from state variable name to state value to T
// This allows conditional icons and commands based on the current state
export interface Action {
  // Character code of the icon for this action
  icon: Cond<string>
  // A command to execute when this action is executed
  command?: Cond<Function>
  // If true, all folders won't close when the command is executed
  keepFolderOpen?: boolean
  // A subfolder to open when this action is executed
  folder?: Folder | string
}

// Used to define a subfolder.
// The 'binds' property represents the same type as config.binds
export interface Folder {
  // Folder name, must be unique
  name: string
  // A list of bindings to apply when the folder is entered
  binds: KeyMap
  // If true, exit folder on key release rather than toggling
  isModifier?: boolean
}

// Aliases can be used to define mappings from a key to another folder and key
// Useful for mapping multiple devices without having to define everything twice
export interface Alias {
  aliasTo: Key,
  folderName?: string
}

// Used internally as the folder name of the root
// When this folder is entered, `device.folderEntered(null)` is called
export const ROOT_FOLDER_NAME = ''

// This function flattens the config file and waits for devices to initialize
// After is complete, the function returns a new Router (defined in router.ts)
export default async function({ devices, binds }: Config) {
  // Wait for all devices to be initialized
  const promises = devices.filter(d => d.initialize).map(d => d.initialize())
  await Promise.all(promises)
  // Build map from folder name to folder object
  const rootFolder = { name: ROOT_FOLDER_NAME, binds }
  const folderNameMap = buildFolderNameMap(rootFolder)
  // Resolve all aliases in the folderName map
  const resolvedFolderMap = resolveAliases(folderNameMap)
  // Returns a new Router instance. This handles the body of the application
  return new Router(devices, resolvedFolderMap)
}

// Converts the recursively-defined structure of the config file into
// a map from folder name to folder contents. All references to subfolders
// are replaced with a string containing the name of the subfolder
function buildFolderNameMap(root: Folder): Record<Key, Folder> {
  // Initialize folder name map with the root folder
  let folderNameMap = { [root.name]: root }
  // Loop through each binding of the root folder
  for (const key of Utils.keys(root.binds)) {
    // The below variable could be an alias. But, if it is, it won't have a
    // 'folder' property, so the body of the if statement below will never run
    const action = root.binds[key] as Action
    // If the binding is a folder and that folder isn't just a name...
    if (action.folder && typeof action.folder === 'object') {
      // ...add it and its children to the folder map
      folderNameMap = { ...folderNameMap, ...buildFolderNameMap(action.folder) }
      // ...and replace the folder object with just its name
      action.folder = action.folder.name
    }
  }
  return folderNameMap
}

// Resolves all occurances of Alias with their corresponding Action 
function resolveAliases(folderMap: Record<Key, Folder>): Record<Key, RouterFolder> {
  // Loops through all folders
  for (const folderName of Utils.keys(folderMap)) {
    const folder = folderMap[folderName]
    // Loops through each bound key of each folder
    for (const boundKey of Utils.keys(folder.binds)) {
      // If the key is bound to an alias, replace it with the action the alias
      // is referring to (specified by a key and possibly a folder)
      if (folder.binds[boundKey].hasOwnProperty('aliasTo')) {
        const alias = folder.binds[boundKey] as Alias
        const sourceFolder = alias.folderName || ROOT_FOLDER_NAME
        folderMap.binds[boundKey] = folderMap[sourceFolder].binds[alias.aliasTo]
      }
    }
  }
  return folderMap as Record<Key, RouterFolder>
}