import * as Hooks from './hooks'

// State condition variable type. Map from variable to value to data
export type Cond<T> = Record<string, Record<string, T>> | T | undefined

// This class allows outside changes to modify keybindings
export default class {
  state: Record<string, any> = {}
  refresh: Function = () => {}

  constructor() {
    // For each module exported by ../state-hooks/index.ts,
    // run the default function exported by that module
    Object.values(Hooks).forEach((module: any) => module(this))
  }

  // Called by router to bind code to state changes
  onRefresh(refreshFn: Function) {
    this.refresh = refreshFn
  } 

  // Called by router to collapse Cond<T> types into a single value
  resolveConditional<T>(conditional: Cond<T>): T | undefined {
    if (typeof conditional !== 'object') return conditional
    for (const stateVar of Object.keys(conditional)) {
      const curValue = this.state[stateVar]
      if (conditional[stateVar].hasOwnProperty(curValue)) {
        return conditional[stateVar][curValue]
      }
    }
  }
}