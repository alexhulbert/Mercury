// ----------
// HUD daemon
// ----------
// Daemon that shows and hides a grid of symbols
// To hide the HUD:
// Use included hudctl.go or call com.alexhulbert.mercury.Hud.Hide
// To show the HUD:
// Use included hudctl.go or call com.alexhulbert.mercury.Hud.Show
// Show accepts 9 arguments, each representing a character code to display

package hudd

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/godbus/dbus"
	"github.com/godbus/dbus/introspect"
	"github.com/gotk3/gotk3/cairo"
	"github.com/gotk3/gotk3/gdk"
	"github.com/gotk3/gotk3/gtk"
)

var win *gtk.Window
var grid *gtk.Grid
var labels [10]*gtk.Label

// CSS provider for each label
var labelProvider [10]*gtk.CssProvider
var labelColor []float64

// Constants
const winSize = 180
const winPadding = 35
const margin = 10
const fontsize = 25000

func main() {
	// Instantiate new GTK window
	gtk.Init(nil)
	win, _ = gtk.WindowNew(gtk.WINDOW_POPUP)

	// Tell window manager to make HUD non-focusable and above everything else
	win.SetCanFocus(false)
	win.SetAcceptFocus(false)
	win.SetFocusOnMap(false)
	win.SetKeepAbove(true)

	// Set window position and size
	refreshPos()
	win.SetSizeRequest(winSize, winSize)

	// Set window title and draw background
	win.SetTitle("HUD")
	drawBackgroundWithOpacity(win, 0.66)

	// Get default text color from GTK theme
	style, _ := win.GetStyleContext()
	fg, _ := style.GetProperty("color", gtk.STATE_FLAG_ACTIVE)
	labelColor = fg.(*gdk.RGBA).Floats()

	// Create a new grid to hold a 3x3 square of text-containing labels
	grid, err := gtk.GridNew()
	if err != nil {
		fmt.Printf("%v", err)
	}
	grid.SetHAlign(gtk.ALIGN_FILL)
	grid.SetVAlign(gtk.ALIGN_FILL)
	grid.SetMarginTop(margin)
	grid.SetMarginEnd(margin)
	grid.SetMarginBottom(margin)
	grid.SetMarginStart(margin)
	win.Add(grid)

	// Create 9 new labels and attach them to grid cells
	for i := 0; i < 9; i++ {
		label, _ := gtk.LabelNew("<span></span>")
		label.SetUseMarkup(true)
		label.SetHAlign(gtk.ALIGN_CENTER)
		label.SetVAlign(gtk.ALIGN_CENTER)
		label.SetHExpand(true)
		label.SetVExpand(true)
		labels[i] = label
		grid.Attach(label, i%3, i/3, 1, 1)
	}

	// Spawn a new dbus server to listen for hide/show events
	spawnListener(win)

	// Show all elements except for root element (invisible on program start)
	win.ShowAll()
	win.SetVisible(false)

	// Start main GTK loop
	gtk.Main()
}

// --------------
// DBUS INTERFACE
// --------------

type hudInterface struct{}

// This function is called when a `com.alexhulbert.mercury.Hide` dbus message is sent
func (hud hudInterface) Hide() *dbus.Error {
	win.SetVisible(false)
	return nil
}

// This function is called when a `com.alexhulbert.mercury.Show` dbus message is sent
func (hud hudInterface) Show(charCodes []string) *dbus.Error {
	// Loop over each of the 9 GTK labels
	for i := 0; i < 9; i++ {
		// Convert hexadecimal character code to unicode string
		unicode, err := strconv.ParseUint(charCodes[i], 16, 16)
		if err != nil {
			log.Fatal("Invalid command line argument supplied")
		}

		// Ignore characters with value 0x0000
		if unicode == 0 {
			continue
		}

		// TODO: Fix this hack to make all characters render at similar sizes
		var size = fontsize
		if unicode < 0xf000 {
			size = int(1.25 * fontsize)
		}

		// Remove any existing CSS data for this label
		labelStyle, _ := labels[i].GetStyleContext()
		if labelProvider[i] != nil {
			labelStyle.RemoveProvider(labelProvider[i])
		}
		// Add CSS to fix the vertical positioning for incorrectly-aligned characters
		// TODO: Fix this hack to make vertical centering work for all characters
		if unicode == 0x27D0 {
			cssRefProvider, _ := gtk.CssProviderNew()
			cssRefProvider.LoadFromData("window label { margin-bottom: -12.5px; }")
			labelProvider[i] = cssRefProvider
			labelStyle.AddProvider(cssRefProvider, gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)
		}

		// TODO: Allow for custom fonts like in main package
		// Create a span containing the character to display and attach it to the label
		labels[i].SetMarkup(
			fmt.Sprintf(
				`<span font_desc='Font Awesome 5 Free' size='%d' foreground='#%02x%02x%02x'>%s</span>`,
				size, uint8(labelColor[0]*255), uint8(labelColor[1]*255), uint8(labelColor[2]*255), string(unicode),
			),
		)
	}

	// Reposition HUD and make it visible
	refreshPos()
	win.SetVisible(true)

	return nil
}

// ------------------
// GTK HELPER METHODS
// ------------------

// Draws a background on the main HUD window with the specified opacity 
func drawBackgroundWithOpacity(win *gtk.Window, opacity float64) {
	// Get default GTK background color
	style, _ := win.GetStyleContext()
	color, _ := style.GetProperty("background-color", gtk.STATE_FLAG_NORMAL)
	rgb := color.(*gdk.RGBA).Floats()

	// Paint RGBA layers on window draw
	win.Connect("draw", func(window *gtk.Window, context *cairo.Context) {
		context.SetSourceRGBA(rgb[0], rgb[1], rgb[2], opacity)
		context.SetOperator(cairo.OPERATOR_SOURCE)
		context.Paint()
	})

	// Redraw RGBA layers now and whenever screen changes
	win.Connect("screen-changed", func() { refreshVisual(win) })
	win.SetAppPaintable(true)
	refreshVisual(win)
}

// Redraw window RGBA values onto application background
func refreshVisual(window *gtk.Window) {
	screen, _ := window.Widget.GetScreen()
	visual, _ := screen.GetRGBAVisual()
	window.Widget.SetVisual(visual)
}

// -----------
// DBUS SERVER
// -----------

const ifaceName = "com.alexhulbert.mercury.Hud"

func spawnListener(win *gtk.Window) {
	// Constructs dbus path name (like com/alexhulbert/mercury/Hud)
	pathName := dbus.ObjectPath("/" + strings.Replace(ifaceName, ".", "/", -1))

	// Instantiate new dbus session
	conn, err := dbus.SessionBus()
	if err != nil {
		panic(err)
	}

	// Create new instance of the HUD interface defined above 
	hud := hudInterface{}

	// Construct new XML definition
	// Contains a list of available dbus methods with their function signatures
	node := &introspect.Node{}
	node.Name = ifaceName
	iface := &introspect.Interface{}
	iface.Name = ifaceName
	mts := introspect.Methods(hud)
	iface.Methods = mts
	node.Interfaces = append(node.Interfaces, *iface)
	dbusXMLStr := introspect.NewIntrospectable(node)

	// Register dbus interface
	conn.Export(hud, pathName, ifaceName)
	conn.Export(introspect.Introspectable(dbusXMLStr), pathName, "org.freedesktop.DBus.Introspectable")
	reply, err := conn.RequestName(ifaceName, dbus.NameFlagDoNotQueue)
	if err != nil {
		panic(err)
	}
	if reply != dbus.RequestNameReplyPrimaryOwner {
		fmt.Fprintln(os.Stderr, "Error: HUD already running")
		os.Exit(1)
	}
}

// Queries monitor width and positions HUD on top right corner
func refreshPos() {
	display, _ := gdk.DisplayGetDefault()
	monitor, _ := display.GetPrimaryMonitor()
	w := monitor.GetGeometry().GetWidth()
	win.Move(w-winSize-winPadding, winPadding)
}
