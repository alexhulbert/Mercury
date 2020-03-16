import State from '..'
import * as FS from 'fs'
import { promisify } from 'util'
import { exec } from 'child_process'

const STATE_FILE = '/tmp/mercury-state'
const EXIT_EVENTS: any[] = ['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2']
const WKSPS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const STATE_KEYS = [
  'sidebarPids', 'sidebarInfo',
  ...WKSPS.map(i => `wksp_${i}_occupied`),
  ...WKSPS.map(i => `wksp_${i}_active`)
]

export const Persist = async (context: State) => {
  const [exists, pidofOutput] = await Promise.all([
    promisify(FS.exists)(STATE_FILE),
    promisify(exec)('pidof i3')
  ])
  const i3pid = parseInt(pidofOutput.stdout, 10)
  if (exists) {
    const stateBuffer = await promisify(FS.readFile)(STATE_FILE)
    const state = JSON.parse(stateBuffer.toString('utf8'))
    if (state.i3pid == i3pid) {
      for (const stateKey of STATE_KEYS) {
        context.state[stateKey] = state[stateKey]
      }
      context.refresh()
    }
  } else {
    context.state.wksp_1_active = true
    context.refresh()
  }

  /*for (const exitEvent of EXIT_EVENTS) {
    process.on(exitEvent, (...args) => {
      const savedState = { i3pid }
      for (const stateKey of STATE_KEYS) {
        savedState[stateKey] = context.state[stateKey]
      }
      FS.writeFileSync(STATE_FILE, JSON.stringify(savedState))
      return true
    })
  }*/
}