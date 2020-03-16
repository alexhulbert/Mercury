import { StreamDeckMIO, Keys } from './devices/stream-deck/index'
import { KeyboardMIO } from './devices/keyboard'
import startKeybindRouter from './keybind-router'
import State from './state'
import CONFIG from '../config'

const {
  A1, A2, A3,
  B1, B2, B3,
  C1, C2, C3
} = Keys

const DEVICES = [
  new KeyboardMIO(/*[ A1, A2, A3, B1, B2, B3, C1, C2, C3 ]*/),
  //new StreamDeckMIO({ externalFontPaths: ['/usr/share/fonts/TTF/MaterialDesignIcons.ttf'] })
]

startKeybindRouter({
  devices: DEVICES,
  binds: CONFIG,
  state: new State()
})