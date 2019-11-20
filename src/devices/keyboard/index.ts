
import * as x11 from 'x11'

import { MercuryIODevice } from '../interface'
import Utils, { XKey } from './utils'

interface KeyFnMap { [modifiers: number]: { [code: number]: Function } }
interface XEvent { name: string, buttons: number, keycode: number }

export class KeyboardMIO implements MercuryIODevice {

  keyDownFns: KeyFnMap = {}
  keyUpFns: KeyFnMap = {}

  grabbedKeys: XKey[] = []
  xDisplay: any
  X: any

  initialize() {
    return new Promise<void>((resolve, reject) => {
      x11.createClient((err, { client: X, screen }) => {
        if (err) {
          reject(err)
        } else {
          this.xDisplay = screen[0].root
          this.X = X
          resolve()
        }
      }).on('event', (ev: any) => this.onXKeyPress(ev))
    })
  }

  isKeyFromDevice(key: symbol | string) {
    return typeof key !== 'symbol' && Utils.parseKeySequence(key).length > 0
  }

  reset() {
    console.clear()
  }

  displayChars(keyCodes: Record<symbol, number>) {
    for (const key of Object.getOwnPropertySymbols(keyCodes)) {
      console.log(`${String(key)}: ${keyCodes[key].toString(16)}`)
    }
  }

  onKeyDown(key: string, fn: Function) {
    const keycodesToBind = Utils.parseKeySequence(key)
    for (const { code, modifiers } of keycodesToBind) {
      this.X.GrabKey(this.xDisplay, 0, modifiers, code, false, true)
      if (!this.keyDownFns[modifiers]) this.keyDownFns[modifiers] = {}
      this.keyDownFns[modifiers][code] = fn
    }
  }

  onKeyUp(key: string, fn: Function) {
    const keycodesToBind = Utils.parseKeySequence(key)
    for (const { code, modifiers } of keycodesToBind) {
      this.X.GrabKey(this.xDisplay, 0, modifiers, code, false, true)
      if (!this.keyUpFns[modifiers]) this.keyUpFns[modifiers] = {}
      this.keyUpFns[modifiers][code] = fn
    }
  }

  unbindKey(key: string) {
    const boundKeycodes = Utils.parseKeySequence(key)
    for (const { code, modifiers } of boundKeycodes) {
      this.X.UngrabKey(this.xDisplay, code, modifiers)
      if (this.keyDownFns[modifiers] && this.keyDownFns[modifiers][code]) {
        delete this.keyDownFns[modifiers][code]
      }
      if (this.keyUpFns[modifiers] && this.keyUpFns[modifiers][code]) {
        delete this.keyUpFns[modifiers][code]
      }
    }
  }

  folderEntered(folderName: string) {
    console.log('ENTERED', folderName)
  }

  private onXKeyPress(event: XEvent) {
    if (
      event.name === 'KeyPress' &&
      this.keyDownFns[event.buttons] &&
      this.keyDownFns[event.buttons][event.keycode]
    ) this.keyDownFns[event.buttons][event.keycode]()
    if (
      event.name === 'KeyRelease' &&
      this.keyUpFns[event.buttons] &&
      this.keyUpFns[event.buttons][event.keycode]
    ) this.keyUpFns[event.buttons][event.keycode]()
  }
}