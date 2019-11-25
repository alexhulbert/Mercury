import { KeyboardMIO } from './src/devices/keyboard'
import Application from './src/keybind-router'

Application({
  devices: [ new KeyboardMIO() ],
  binds: {/**/
    'KP_End': {
      icon: 'aa00',
      folder: {
        name: 'A',
        binds: {
          'KP_Down': {
            icon: 'aabb',
            folder: {
              name: 'AB',
              binds: {
                'KP_Down': {
                  icon: 'abab',
                  command: () => console.log('ABB')
                },
                'KP_Next': {
                  icon: 'aabc',
                  folder: {
                    name: 'ABC',
                    binds: {
                      'KP_Left': {
                        icon: 'abcd',
                        command: () => console.log('ABCD')
                      },
                      'KP_Begin':{
                        icon: 'abce',
                        command: () => console.log('ABCE')
                      }
                    }
                  }
                },
                'KP_Left': {
                  icon: 'aabd',
                  command: () => console.log('ABD clicked')
                }
              }
            }
          },
          'KP_Next': {
            icon: 'aacc',
            command: () => console.log('AC clicked')
          },
          'KP_Left': {
            icon: 'aadd',
            command: () => console.log('AD clicked')
          }
        }
      }
    },
    'KP_Down': {
      icon: 'bb00',
      command: () => console.log('B clicked')
    },
    'KP_Next': {
      icon: 'cc00',
      folder: {
        name: 'C',
        binds: {
          'KP_End': {
            icon: 'ccaa',
            command: () => console.log('CA clicked')
          },
          'KP_Down': {
            icon: 'ccbb',
            command: () => console.log('CB clicked')
          }
        }
      }
    },
    'KP_Left': {
      icon: 'dd00',
      command: () => console.log('D clicked')
    }
  /**/}
})