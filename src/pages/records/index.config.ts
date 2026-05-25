export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '操作记录' })
  : { navigationBarTitleText: '操作记录' }
