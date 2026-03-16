import { View, Text, Image, Swiper, SwiperItem } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

// 首页
export default function Index() {
  const [banners] = useState([
    { id: 1, image: 'https://via.placeholder.com/750x300?text=代理记账套餐', title: '代理记账套餐' },
    { id: 2, image: 'https://via.placeholder.com/750x300?text=公司注册服务', title: '公司注册服务' },
    { id: 3, image: 'https://via.placeholder.com/750x300?text=税务申报服务', title: '税务申报服务' },
  ])

  const [categories] = useState([
    { id: 1, name: '代理记账', icon: '📒', count: 15 },
    { id: 2, name: '公司注册', icon: '🏢', count: 8 },
    { id: 3, name: '税务申报', icon: '📊', count: 12 },
    { id: 4, name: '商标注册', icon: '®️', count: 6 },
    { id: 5, name: '资质办理', icon: '📋', count: 10 },
    { id: 6, name: '更多服务', icon: '➕', count: 0 },
  ])

  const [hotProducts] = useState([
    { id: 1, name: '小规模代理记账', price: 199, originalPrice: 299, unit: '月', sales: 1256 },
    { id: 2, name: '一般纳税人代理记账', price: 399, originalPrice: 599, unit: '月', sales: 856 },
    { id: 3, name: '公司注册（有限责任公司）', price: 599, originalPrice: 899, unit: '次', sales: 623 },
    { id: 4, name: '个体工商户注册', price: 299, originalPrice: 499, unit: '次', sales: 445 },
  ])

  const goToProduct = (id: number) => {
    Taro.navigateTo({
      url: `/pages/products/detail?id=${id}`
    })
  }

  return (
    <View className='index'>
      {/* 搜索栏 */}
      <View className='search-bar'>
        <View className='search-input' onClick={() => Taro.navigateTo({ url: '/pages/products/search' })}>
          <Text className='search-icon'>🔍</Text>
          <Text className='search-placeholder'>搜索服务...</Text>
        </View>
      </View>

      {/* 轮播图 */}
      <Swiper
        className='banner-swiper'
        indicatorDots
        autoplay
        circular
        indicatorColor='rgba(255, 255, 255, 0.5)'
        indicatorActiveColor='#F59E0B'
      >
        {banners.map(banner => (
          <SwiperItem key={banner.id}>
            <View className='banner-item'>
              <Image src={banner.image} mode='aspectFill' className='banner-image' />
            </View>
          </SwiperItem>
        ))}
      </Swiper>

      {/* 服务分类 */}
      <View className='section'>
        <View className='section-header'>
          <Text className='section-title'>服务分类</Text>
        </View>
        <View className='category-grid'>
          {categories.map(category => (
            <View 
              key={category.id} 
              className='category-item'
              onClick={() => Taro.navigateTo({ url: `/pages/products/index?category=${category.id}` })}
            >
              <Text className='category-icon'>{category.icon}</Text>
              <Text className='category-name'>{category.name}</Text>
              {category.count > 0 && (
                <Text className='category-count'>{category.count}项服务</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* 热门服务 */}
      <View className='section'>
        <View className='section-header'>
          <Text className='section-title'>热门服务</Text>
          <Text className='section-more' onClick={() => Taro.switchTab({ url: '/pages/products/index' })}>
            查看全部 ›
          </Text>
        </View>
        <View className='product-list'>
          {hotProducts.map(product => (
            <View key={product.id} className='product-item' onClick={() => goToProduct(product.id)}>
              <View className='product-info'>
                <Text className='product-name'>{product.name}</Text>
                <View className='product-sales'>
                  <Text>已售 {product.sales}</Text>
                </View>
                <View className='product-price'>
                  <Text className='price-current'>¥{product}</Text>
                  <Text className='price-unit'>/{product.unit}</Text>
                  {product.originalPrice && (
                    <Text className='price-original'>¥{product.originalPrice}</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
