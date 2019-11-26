import * as GI from 'node-gtk'
const Gtk = GI.require('Gtk', '3.0')
const Gdk = GI.require('Gdk', '3.0')
const Cairo = GI.require('cairo')
GI.startLoop()

const SIZE = 4

const CELL_SIZE = 30
const WIN_PADDING = 35
const MARGIN = 10
const FONT_SIZE = 25000

const WIN_SIZE = CELL_SIZE * SIZE + MARGIN * (SIZE - 1) + WIN_PADDING * 2
export default class HUD {
  win: any
  labels: any[] = []
  labelProviders: any[] = []

  constructor(
    public labelColor = [0, 0, 0],
    public backgroundColor = [255, 255, 255]
  ) {
    // Instantiate new GTK window
    Gtk.init()
    this.win = new Gtk.Window({
      type: Gtk.WindowType.POPUP,
      title: 'HUD'
    })

    // Tell window manager to make HUD non-focusable and above everything else
    this.win.setCanFocus(false)
    this.win.setAcceptFocus(false)
    this.win.setFocusOnMap(false)
    this.win.setKeepAbove(true)

    // Set window position and size
    this.refreshPos()
    this.win.setSizeRequest(WIN_SIZE, WIN_SIZE)

    // Set window title and draw background
    this.drawBackgroundWithOpacity(0.66)

    // Create a new grid to hold a NxN square of text-containing labels
    const grid = new Gtk.Grid()
    grid.setHalign(Gtk.Align.FILL)
    grid.setValign(Gtk.Align.FILL)
    this.win.add(grid)

    // Create N*N new labels and attach them to grid cells
    for (let i = 0; i < SIZE * SIZE; i++) {
      const label = new Gtk.Label("<span></span>")
      label.setUseMarkup(true)
      label.setHalign(Gtk.Align.CENTER)
      label.setValign(Gtk.Align.CENTER)
      label.setHexpand(true)
      label.setVexpand(true)
      this.labels[i] = label
      grid.attach(label, i % SIZE, i / SIZE, 1, 1)
    }

    // Show all elements except for root element (invisible on program start)
    this.win.showAll()
    this.win.setVisible(false)

    // Start main GTK loop
    process.nextTick(Gtk.main)
  }

  show(codes: number[]) {
    // Loop over each of the NxN GTK labels
    for (let i = 0; i < SIZE * SIZE; i++) {
      // Ignore characters with value 0x0000
      const code = codes[i]
      if (!code) continue

      // TODO: Fix this hack to make all characters render at similar sizes
      const size = code < 0xf000 ? FONT_SIZE * 1.25 : FONT_SIZE

      // Remove any existing CSS data for this label
      const labelStyle = this.labels[i].getStyleContext()
      if (this.labelProviders[i]) {
        labelStyle.removeProvider(this.labelProviders[i])
      }
      // Add CSS to fix the vertical positioning for incorrectly-aligned characters
      // TODO: Fix this hack to make vertical centering work for all characters
      if (code == 0x27D0) {
        const cssRefProvider = new Gtk.CssProvider()
        cssRefProvider.loadFromData("window label { margin-bottom: -12.5px; }")
        this.labelProviders[i] = cssRefProvider
        labelStyle.addProvider(cssRefProvider, 9999)
      }

      // TODO: Allow for custom fonts like in main package
      // Create a span containing the character to display and attach it to the label
      this.labels[i].setMarkup(
        `<span
          font_desc='Font Awesome 5 Free'
          size='${size}'
          foreground='#${
            this.labelColor.map(v => v.toString(16).padStart(2, '0')).join('')
          }'
        >${String.fromCharCode(code)}</span>`
      )
    }

    // Reposition HUD and make it visible
    this.refreshPos()
    this.win.setVisible(true)
  }

  hide() {
    this.win.setVisible(false)
  }

  // Queries monitor width and positions HUD on top right corner
  private refreshPos() {
    // TODO: Calculate width
    const width = 1920
    this.win.move(width - WIN_SIZE - WIN_PADDING, WIN_PADDING)
  }

  // Draws a background on the main HUD window with the specified opacity 
  private drawBackgroundWithOpacity(opacity: number) {

    // Paint RGBA layers on window draw
    this.win.on('draw', (context: any) => {
      context.setSourceRgba(...this.backgroundColor, opacity)
      context.setOperator(Cairo.Operator.SOURCE)
      context.paint()
    })

    // Redraw RGBA layers now and whenever screen changes
    this.win.on('screen-changed', () => {
      const visual = this.win.getScreen().getRgbaVisual()
      this.win.setVisual(visual)
    })
    this.win.setAppPaintable(true)
    const visual = this.win.getScreen().getRgbaVisual()
    this.win.setVisual(visual)
  }
}