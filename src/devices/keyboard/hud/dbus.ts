import * as DBus from 'dbus-native'

const SERVICE_NAME = 'com.alexhulbert.Hud'
const BUS_DESTINATION = {
  path: '/' + SERVICE_NAME.replace(/\./g, '/'),
  destination: SERVICE_NAME,
  interface: SERVICE_NAME
}

export default class HUD {

  bus: any
  errCount = 0

  constructor() {
    this.bus = DBus.sessionBus()
    if (!this.bus) {
      throw new Error('Error: Could not connect to the DBus session bus.')
    }
  }

  show(codes: number[]) {
    this.bus.invoke({
      ...BUS_DESTINATION,
      member: 'Show',
      signature: 'as',
      body: [codes.map(this.charCodeToHex)]
    }, err => this.onInvoke(err, () => this.show(codes)))
  }

  hide() {
    this.bus.invoke({
      ...BUS_DESTINATION,
      member: 'Hide'
    }, err => this.onInvoke(err, () => this.hide()))
  }

  private onInvoke(err: any, retryFn: Function) {
    if (err) {
      this.errCount++
      setTimeout(retryFn, 50)
    } else {
      this.errCount = 0
    }
  }

  private charCodeToHex(charCode: number) {
    return charCode.toString(16).padStart(4, '0')
  }
}