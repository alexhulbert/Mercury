import * as GI from 'node-gtk'
const Gtk = GI.require('Gtk', '3.0')
const Cairo = GI.require('cairo')
GI.startLoop()

const DIM = 3
const FONT_NAME = 'Font Awesome 5 Free'
const CELL_SIZE = 30
const WIN_PADDING = 35
const MARGIN = 10
const FONT_SIZE = 25000

const WIN_SIZE = CELL_SIZE * DIM + MARGIN * (DIM - 1) + WIN_PADDING * 2
export default class HUD {
  win: any
  labels: any[] = []

  constructor() {
    // Instantiate new GTK window
    Gtk.init()
    this.win = new Gtk.Window({
      title: 'HUD',
      type: Gtk.WindowType.POPUP
    })

    // Don't allow window manager to focus HUD
    this.win.canFocus = false
    this.win.acceptFocus = false
    this.win.focusOnMap = false

    // Set window position and size
    this.refreshPos()
    this.win.setSizeRequest(WIN_SIZE, WIN_SIZE)

    // Put this window above others, but make background semi-transparent
    this.win.setKeepAbove(true)
    this.drawBackgroundWithOpacity(0.66)

    // Create a new grid to hold a NxN square of text-containing labels
    const grid = new Gtk.Grid()
    grid.halign = Gtk.Align.FILL
    grid.valign = Gtk.Align.FILL
    this.win.add(grid)

    // Create N*N new labels and attach them to grid cells
    for (let i = 0; i < DIM * DIM; i++) {
      const label = new Gtk.Label("<span></span>")
      label.useMarkup = true
      label.halign = Gtk.Align.CENTER
      label.valign = Gtk.Align.CENTER
      label.hexpand = true
      label.vexpand = true
      this.labels[i] = label
      grid.attach(label, i % DIM, i / DIM, 1, 1)
    }

    // Show all elements except for root element (invisible on program start)
    this.win.showAll()
    this.win.visible = false

    // Start main GTK loop after parent process finishes bindings
    process.nextTick(Gtk.main)
  }

  show(codes: number[]) {
    // Loop over each of the NxN GTK labels
    for (let i = 0; i < DIM * DIM; i++) {
      // Ignore characters with value 0x0000
      if (!codes[i]) continue

      // Create a span containing the char to display and attach it to the label
      const char = String.fromCharCode(codes[i])
      this.labels[i].setMarkup(
        `<span font_desc='${FONT_NAME}' size='${FONT_SIZE}'>${char}</span>`
      )
    }

    // Reposition HUD and make it visible
    this.refreshPos()
    this.win.visible = true
  }

  hide() {
    this.win.visible = false
  }

  // Queries monitor width and positions HUD on top right corner
  private refreshPos() {
    const screenWidth = this.win.getScreen().getWidth()
    this.win.move(screenWidth - WIN_SIZE - WIN_PADDING, WIN_PADDING)
  }

  // Draws a background on the main HUD window with the specified opacity 
  private drawBackgroundWithOpacity(opacity: number) {
    // Get original background color from color scheme
    const styleContext = this.win.getStyleContext()
    const bgColor = styleContext.getBackgroundColor(Gtk.StateType.NORMAL)

    // Paint RGBA layers on window draw
    this.win.on('draw', (context: any) => {
      context.setSourceRgba(bgColor.red, bgColor.green, bgColor.blue, opacity)
      context.setOperator(Cairo.Operator.SOURCE)
      context.paint()
    })

    // Redraw RGBA layers now and whenever screen changes
    this.win.on('screen-changed', () => {
      this.win.setVisual(this.win.screen.getRgbaVisual())
    })
    this.win.setAppPaintable(true)
    this.win.setVisual(this.win.screen.getRgbaVisual())
  }
}