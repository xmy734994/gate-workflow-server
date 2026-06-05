import path from 'path'
import type { IConfig } from '@tarojs/taro'

const config: IConfig = {
  projectName: 'flight-workflow',
  date: '2024-1-1',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
    375: 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {
  },
  alias: {
    '@/components/ui': path.resolve(__dirname, '../src/components/ui'),
    '@/network': path.resolve(__dirname, '../src/network'),
    '@/lib': path.resolve(__dirname, '../src/lib'),
    '@': path.resolve(__dirname, '../src'),
  },
  copy: {
    patterns: [
    ],
    options: {
    },
  },
  framework: 'react',
  mini: {
    compile: {
      exclude: [
        path.resolve(__dirname, '../node_modules/@iconify-icons/'),
        path.resolve(__dirname, '../src/lib/getui/'),
        'class-variance-authority',
      ],
    },
    webpackChain(chain) {
      // Handle class-variance-authority ESM module
      chain.resolve.alias
        .set('class-variance-authority', path.resolve(__dirname, '../src/lib/cva-shim.ts'))
    },
  },
  h5: {
    webpackChain(chain) {
      // Add @ alias for webpack
      chain.resolve.alias.set('@', path.resolve(__dirname, '../src'))
    },
  },
}

module.exports = function (merge: any) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'))
  }
  return merge({}, config, require('./prod'))
}
