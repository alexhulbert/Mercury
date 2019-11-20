import * as StreamDeck from 'elgato-stream-deck'

import { MercuryIODevice } from '../interface'
import Utils from './utils'

export interface InitConfig {
  // Path to stream deck device (e.g. 0001:0021:00)
  path?: string
  // List of external fonts to load
  externalFontPaths?: string[]
}

// Defined in order of their index on elgato-stream-deck module
const keyNames = [
  'A8', 'A7', 'A6', 'A5', 'A4', 'A3', 'A2', 'A1',
  'B8', 'B7', 'B6', 'B5', 'B4', 'B3', 'B2', 'B1',
  'C8', 'C7', 'C6', 'C5', 'C4', 'C3', 'C2', 'C1',
  'D8', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1',
]
// Type is defined as all valid strings
type KeyString =
  'A8' | 'A7' | 'A6' | 'A5' | 'A4' | 'A3' | 'A2' | 'A1' |
  'B8' | 'B7' | 'B6' | 'B5' | 'B4' | 'B3' | 'B2' | 'B1' |
  'C8' | 'C7' | 'C6' | 'C5' | 'C4' | 'C3' | 'C2' | 'C1' |
  'D8' | 'D7' | 'D6' | 'D5' | 'D4' | 'D3' | 'D2' | 'D1'
// 'Keys' is a map from string to symbol. Exported and used as an enum
export const Keys = {} as Record<KeyString, symbol>
for (const keyString of keyNames) Keys[keyString] = Symbol(keyString)

export class StreamDeckMIO implements MercuryIODevice {
  // Main object for communicating with StreamDeck
  streamDeck: StreamDeck.StreamDeck

  // Map from keys to currently bound function, one for each event type
  keyDownFns: Record<symbol, Function>
  keyUpFns: Record<symbol, Function>

  constructor(config: InitConfig) {
    if (config.externalFontPaths) Utils.registerFonts(config.externalFontPaths)
    if (config.path) {
      this.streamDeck = StreamDeck.openStreamDeck(config.path)
    } else {
      // Find first stream deck and connect to it
      const streamDeckInfoObjs = StreamDeck.listStreamDecks()
      if (!streamDeckInfoObjs.length) {
        throw new Error('Error: No stream decks found')
      }
      this.streamDeck = StreamDeck.openStreamDeck(streamDeckInfoObjs[0].path)
    }
    // Binds actual StreamDeck events to local `onEvent` function
    this.streamDeck.on('down', key => this.onEvent('down', key))
    this.streamDeck.on('up', key => this.onEvent('up', key))
    this.streamDeck.on('error', err => console.error('Error:', err))
  }

  isKeyFromDevice(key: symbol | string) {
    return typeof key === 'symbol' && Object.values(Keys).includes(key)
  }

  reset() {
    this.keyDownFns = {}
    this.keyUpFns = {}
    this.streamDeck.clearAllKeys()
  }

  displayChars(keyCodes: Record<symbol, number>) {
    for (const key of Object.keys(keyCodes)) {
      // Convert keyCode into buffer of RGB triplets
      const imageBuffer = Utils.renderChar(
        String.fromCharCode(keyCodes[key]),
        this.streamDeck.ICON_SIZE
      )
      // Load RGB triplets into StreamDeck
      this.streamDeck.fillImage(parseInt(key, 10), imageBuffer)
    }
  }

  onKeyDown(key: symbol, fn: Function) {
    this.keyDownFns[key] = fn
  }

  onKeyUp(key: symbol, fn: Function) {
    this.keyUpFns[key] = fn
  }

  unbindKey(key: symbol) {
    delete this.keyDownFns[key]
    delete this.keyUpFns[key]
  }

  // Calls relevant bound function (if any) on StreamDeck event
  private onEvent(event: 'up' | 'down', keyIndex: number) {
    // Get the nth key name and resolve it to its symbol
    const key = Keys[keyNames[keyIndex]]
    if (event === 'up' && this.keyUpFns[key]) {
      this.keyUpFns[key]()
    } else if (event === 'down' && this.keyDownFns[key]) {
      this.keyDownFns[key]()
    }
  }
}