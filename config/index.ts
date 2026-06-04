import fs from 'node:fs';
import path from 'node:path';

import { defineConfig, type UserConfigExport } from '@tarojs/cli';
import dotenv from 'dotenv';
import weappPlugin from '@tarojs/plugin-platform-weapp';
import reactPlugin from '@tarojs/plugin-framework-react';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

export default defineConfig<'webpack'>(async (merge, _env) => {
  // Force webpack bundler for Coze platform compatibility
  process.env.TARO_BUNDLER = 'webpack';
  
  const outputRootMap: Record<string, string> = {
    weapp: 'dist',
    tt: 'dist-tt',
    h5: 'dist-web',
  };
  const defaultOutputRoot = outputRootMap[process.env.TARO_ENV || ''] || 'dist';
  const outputRoot = process.env.OUTPUT_ROOT?.trim() || defaultOutputRoot;

  const baseConfig: UserConfigExport<'webpack'> = {
    projectName: 'coze-mini-program',
    date: '2026-1-13',
    alias: {
      '@': path.resolve(__dirname, '..', 'src'),
    },
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: 'src',
    outputRoot,
    plugins: [
      weappPlugin,
      reactPlugin,
    ],
    defineConstants: {
      PROJECT_DOMAIN: JSON.stringify(
        process.env.PROJECT_DOMAIN ||
          process.env.COZE_PROJECT_DOMAIN_DEFAULT ||
          'https://cz-266108-10-1439984716.sh.run.tcloudbase.com',
      ),
      TARO_ENV: JSON.stringify(process.env.TARO_ENV),
    },
    copy: {
      patterns: [],
      options: {},
    },
    framework: 'react',
    mini: {
      compile: {
        exclude: [
          path.resolve(__dirname, '../node_modules/class-variance-authority'),
        ],
      },
      postcss: {
        pxtransform: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
      webpackChain(chain) {
        chain.merge({
          resolve: {
            alias: {
              'class-variance-authority': path.resolve(__dirname, '../src/lib/cva-shim.ts'),
            },
          },
        });
      },
    },
    h5: {
      publicPath: './',
      staticDirectory: 'static',
      router: {
        mode: 'hash',
      },
      devServer: {
        port: 5000,
        host: '0.0.0.0',
        open: false,
        proxy: {
          '/api': {
            target: 'https://cz-266108-10-1439984716.sh.run.tcloudbase.com',
            changeOrigin: true,
            rewrite: (pathStr) => pathStr.replace(/^\/api/, '/api'),
          },
        },
      },
    },
  };

  if (process.env.TARO_ENV === 'tt') {
    const config = {
      miniprogramRoot: './',
      projectname: 'coze-mini-program',
      appid: process.env.TARO_APP_TT_APPID || '',
      setting: {
        urlCheck: false,
        es6: false,
        postcss: false,
        minified: false,
      },
    };
    const outputDir = path.resolve(__dirname, '..', outputRoot);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(
      path.resolve(outputDir, 'project.config.json'),
      JSON.stringify(config, null, 2),
    );
  }

  return merge(baseConfig, {});
});
