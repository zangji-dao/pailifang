/**
 * 小程序页面配置
 * 
 * tabBar 配置底部导航栏
 * 页面顺序决定小程序首页
 */
export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/products/index',
    'pages/cart/index',
    'pages/orders/index',
    'pages/profile/index',
    'pages/user/login',
    'pages/user/register',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'Π立方企业服务',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#999',
    selectedColor: '#F59E0B',
    backgroundColor: '#fff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/images/tab-home.png',
        selectedIconPath: 'assets/images/tab-home-active.png'
      },
      {
        pagePath: 'pages/products/index',
        text: '服务',
        iconPath: 'assets/images/tab-product.png',
        selectedIconPath: 'assets/images/tab-product-active.png'
      },
      {
        pagePath: 'pages/cart/index',
        text: '购物车',
        iconPath: 'assets/images/tab-cart.png',
        selectedIconPath: 'assets/images/tab-cart-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/images/tab-profile.png',
        selectedIconPath: 'assets/images/tab-profile-active.png'
      }
    ]
  }
})

function defineAppConfig(config: any) {
  return config
}
