import { Key } from './index'

export default {
  // Returns all strings and symbols present as keys of an object
  keys(obj: Object): Key[] {
    return [
      ...Object.getOwnPropertyNames(obj),
      ...Object.getOwnPropertySymbols(obj)
    ] as Key[]
  }
}