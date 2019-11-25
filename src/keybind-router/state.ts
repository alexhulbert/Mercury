import * as Hooks from '../state-hooks'

// State condition variable type. Map from variable to value to data
export type Cond<T> = T | Record<string, Record<string, T>>

// This class allows outside changes to modify keybindings
export class State {
  private state: Record<string, string> = {}
  private refreshFn: Function = () => {}

  constructor() {
    // For each module exported by ../state-hooks/index.ts,
    // run the default function exported by that module
    Object.values(Hooks).forEach((module: any) => module(this))
  }

  // Called by router to bind code to state changes
  onRefresh(refreshFn: Function) {
    this.refreshFn = refreshFn
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

  // Called by state hooks to get the value of something in the state
  get(stateVariable: string) {
    return this.state[stateVariable]
  }

  // Called by state hooks to set the value of something in the state
  put(stateVariable: string, value: string) {
    this.state[stateVariable] = value
    // When something changes in the state, refreshFn should be called
    this.refreshFn()
  }
}