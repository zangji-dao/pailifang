import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Profile() {
  const menuItems = [
    { icon: '📋', title: '我的订单', path: '/pages/orders/index' },
    { icon: '🏢', title: '我的企业', path: '/pages/profile/company' },
    { icon: '📄', title: '服务记录', path: '/pages/profile/services' },
    { icon: '💰', title: '发票管理', path: '/pages/profile/invoices' },
    { icon: '💬', title: '消息通知', path: '/pages/profile/messages' },
    { icon: '⚙️', title: '设置', path: '/pages/profile/settings' },
  ]

  return (
    <View className='profile'>
      {/* 用户信息 */}
      <View className='user-card'>
        <View className='user-info'>
          <Image 
            src='https://via.placeholder.com/100x100?text=Avatar' 
            className='avatar'
          />
          <View className='user-detail'>
            <Text className='username'>点击登录</Text>
            <Text className='user-tip'>登录后享受更多服务</Text>
          </View>
        </View>
      </View>

      {/* 订单快捷入口 */}
      <View className='order-shortcuts'>
        <View className='shortcut-item'>
          <Text className='shortcut-icon'>🕐</Text>
          <Text className='shortcut-text'>待付款</Text>
        </View>
        <View className='shortcut-item'>
          <Text className='shortcut-icon'>📦</Text>
          <Text className='shortcut-text'>待服务</Text>
        </View>
        <View className='shortcut-item'>
          <Text className='shortcut-icon'>🔄</Text>
          <Text className='shortcut-text'>服务中</Text>
        </View>
        <View className='shortcut-item'>
          <Text className='shortcut-icon'>✅</Text>
          <Text className='shortcut-text'>已完成</Text>
        </View>
      </View>

      {/* 菜单列表 */}
      <View className='menu-list'>
        {menuItems.map((item, index) => (
          <View 
            key={index} 
            className='menu-item'
            onClick={() => Taro.navigateTo({ url: item.path })}
          >
            <Text className='menu-icon'>{item.icon}</Text>
            <Text className='menu-title'>{item.title}</Text>
            <Text className='menu-arrow'>›</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
