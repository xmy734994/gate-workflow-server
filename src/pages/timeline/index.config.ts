export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '时间线提醒' })
  : { navigationBarTitleText: '时间线提醒' }
