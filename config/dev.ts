import type { IConfig } from '@tarojs/taro'
import path from 'path'

const devConfig: IConfig = {
  mini: {},
  h5: {
    prebundleOptions: { enable: false },
  },
}

export default devConfig
