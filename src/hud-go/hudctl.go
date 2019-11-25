// -----------------------
// HUD control application
// -----------------------
// Used to test the numpad hud
// To hide the HUD:
// ./hudctl Hide
// To show characters on the hud:
// ./hudctl Show 0123 4567 89ab cdef 0123 4567 89ab cdef 0123

package hudctl

import (
	"os"
	"strings"

	"github.com/godbus/dbus"
)

const ifaceName = "com.alexhulbert.mercury.Hud"

func main() {
	// Constructs dbus path name (like com/alexhulbert/mercury/Hud)
	pathName := dbus.ObjectPath("/" + strings.Replace(ifaceName, ".", "/", -1))

	// Instantiate new dbus session
	conn, err := dbus.SessionBus()
	if err != nil {
		panic(err)
	}
	connObj := conn.Object(ifaceName, pathName)

	// Use supplied command line arguments to call a HUD dbus method
	if len(os.Args) > 2 {
		cmd(connObj, os.Args[1], os.Args[2:])
	} else if len(os.Args) > 1 {
		cmd(connObj, os.Args[1])
	} else {
		fmt.Fprintln(os.Stderr, "Error: Invalid arguments supplied")
		os.Exit(1)
	}
}

// Calls `method` with `args` on DBus session
// Ex: com.alexhulbert.mercury.Hud.Show 0000 1111 2222 ...
func cmd(connObj dbus.BusObject, method string, args ...interface{}) {
	call := connObj.Call(ifaceName+"."+method, 0, args...)
	if call.Err != nil {
		panic(call.Err)
	}
}
