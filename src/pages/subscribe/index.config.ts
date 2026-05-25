export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '通知订阅设置' })
  : { navigationBarTitleText: '通知订阅设置' }
