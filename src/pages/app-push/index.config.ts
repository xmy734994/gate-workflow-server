export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: 'APP推送设置' })
  : { navigationBarTitleText: 'APP推送设置' }
