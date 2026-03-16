# 渠道API对接指南

本文档详细说明各营销渠道的API能力、可获取数据及对接方式。

---

## 一、短视频平台

### 1. 抖音（字节跳动）

#### API入口
- **开放平台**：https://open.douyin.com/
- **线索通API**：用于获取广告线索表单数据
- **企业私信API**：用于获取私信消息

#### 可获取数据

| 数据类型 | 字段 | 说明 |
|----------|------|------|
| **线索表单** | cluedetail_id | 线索ID |
| | name | 姓名 |
| | phone | 电话 |
| | custom_fields | 自定义表单字段（公司、地址等） |
| | external_url | 来源落地页 |
| | create_time | 提交时间 |
| **来源追踪** | advertiser_id | 广告主ID |
| | campaign_id | 广告计划ID |
| | ad_id | 广告创意ID |
| | video_id | 来源视频ID |
| | aweme_name | 视频标题 |
| **直播间** | room_id | 直播间ID |
| | user_comment | 直播间评论 |

#### 对接方式

```typescript
// 1. 申请权限
// - 在抖音开放平台创建应用
// - 申请「线索数据」权限

// 2. OAuth授权
const authUrl = `https://open.douyin.com/platform/oauth/connect/?app_id=${APP_ID}&state=STATE&response_type=code&scope=user_info,clue.data`;

// 3. 获取Access Token
const tokenResponse = await fetch('https://open.douyin.com/oauth/access_token/', {
  method: 'POST',
  body: JSON.stringify({
    client_key: APP_ID,
    client_secret: APP_SECRET,
    code: authCode,
    grant_type: 'authorization_code'
  })
});

// 4. 获取线索列表
const cluesResponse = await fetch(`https://open.douyin.com/api/clue/v1/list/?access_token=${access_token}`, {
  method: 'POST',
  body: JSON.stringify({
    advertiser_id: ADVERTISER_ID,
    start_time: '2024-01-01 00:00:00',
    end_time: '2024-01-31 23:59:59',
    page: 1,
    page_size: 100
  })
});
```

#### Webhook回调（推荐）
```
配置回调URL后，有新线索时会自动推送：
POST https://your-domain.com/api/webhook/douyin/clue
Content-Type: application/json

{
  "event": "clue_submit",
  "data": {
    "clue_id": "xxx",
    "name": "张三",
    "phone": "138****1234",
    "form_data": {...},
    "source_info": {...}
  }
}
```

---

### 2. 快手

#### API入口
- **开放平台**：https://open.kuaishou.com/
- **线索API**：快手广告线索数据

#### 可获取数据

| 数据类型 | 字段 | 说明 |
|----------|------|------|
| **线索表单** | clue_id | 线索ID |
| | name | 姓名 |
| | phone | 电话 |
| | comment | 备注 |
| | create_time | 提交时间 |
| **来源追踪** | campaign_id | 计划ID |
| | unit_id | 单元ID |
| | creative_id | 创意ID |
| | photo_id | 作品ID |

#### 对接方式

```typescript
// 1. 获取Access Token
const tokenResponse = await fetch('https://open.kuaishou.com/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: APP_ID,
    client_secret: APP_SECRET
  })
});

// 2. 获取线索数据
const cluesResponse = await fetch(`https://open.kuaishou.com/openapi/clue/list`, {
  headers: {
    'Access-Token': access_token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    start_time: '2024-01-01',
    end_time: '2024-01-31'
  })
});
```

---

### 3. 视频号（微信生态）

#### API入口
- **微信开放平台**：https://open.weixin.qq.com/
- **视频号小店API**：订单、客服消息
- **视频号直播API**：直播间数据

#### 可获取数据

| 数据类型 | 字段 | 说明 |
|----------|------|------|
| **直播线索** | nickname | 昵称 |
| | openid | 用户标识 |
| | comment_content | 评论内容 |
| | live_id | 直播ID |
| **小店订单** | order_id | 订单ID |
| | product_info | 商品信息 |
| | buyer_info | 买家信息 |

#### 对接方式
```typescript
// 视频号API与微信公众号共用Access Token
// 需要在微信开放平台绑定视频号

// 获取直播评论
const comments = await fetch(`https://api.weixin.qq.com/wxaapi/broadcast/room/getcomment?access_token=${access_token}`, {
  method: 'POST',
  body: JSON.stringify({
    room_id: room_id,
    start: 0,
    count: 100
  })
});
```

---

### 4. B站（哔哩哔哩）

#### API入口
- **开放平台**：https://openhome.bilibili.com/

#### 可获取数据

| 数据类型 | 字段 | 说明 |
|----------|------|------|
| **视频数据** | bvid | 视频ID |
| | title | 标题 |
| | view | 播放量 |
| | like | 点赞数 |
| | comment | 评论数 |
| **评论** | rpid | 评论ID |
| | member.name | 用户名 |
| | content | 评论内容 |
| **私信** | msg | 消息内容（需特殊权限） |

#### 对接方式
```typescript
// B站开放平台OAuth授权后获取数据
// 注：私信API权限较难申请，多数场景用手动录入

// 获取视频评论
const comments = await fetch(`https://api.bilibili.com/x/v2/reply?type=1&oid=${aid}&pn=1&ps=50`, {
  headers: {
    'Cookie': 'SESSDATA=xxx' // 需要登录态
  }
});
```

---

## 二、社交媒体平台

### 1. 微信（公众号/小程序/企业微信）

#### API入口
- **微信公众平台**：https://mp.weixin.qq.com/
- **微信开放平台**：https://open.weixin.qq.com/

#### 可获取数据

| 平台 | 数据类型 | 字段 | 说明 |
|------|----------|------|------|
| **公众号** | 粉丝信息 | openid | 用户标识 |
| | | nickname | 昵称 |
| | | headimgurl | 头像 |
| | | subscribe_time | 关注时间 |
| | 消息 | msgtype | 消息类型 |
| | | content | 消息内容 |
| | 菜单点击 | event_key | 菜单标识 |
| **小程序** | 用户信息 | openid | 用户标识 |
| | | phone | 手机号（需授权） |
| | | nickname | 昵称 |
| | 表单提交 | form_data | 表单数据 |
| **企业微信** | 客户信息 | external_userid | 客户ID |
| | | name | 姓名 |
| | | avatar | 头像 |
| | 聊天记录 | msg_time | 消息时间 |
| | | msg_content | 消息内容 |

#### 对接方式

```typescript
// 1. 获取Access Token
const tokenResponse = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`);
const { access_token } = await tokenResponse.json();

// 2. 接收消息推送（配置服务器URL）
// 在公众号后台配置服务器地址：https://your-domain.com/api/wechat/callback
// 用户发送消息时会推送到这个地址

// 3. 消息推送格式（XML）
/*
<xml>
  <ToUserName>公众号ID</ToUserName>
  <FromUserName>用户OpenID</FromUserName>
  <CreateTime>1348831860</CreateTime>
  <MsgType>text</MsgType>
  <Content>你好，想咨询代理记账</Content>
</xml>
*/

// 4. 获取用户信息
const userInfo = await fetch(`https://api.weixin.qq.com/cgi-bin/user/info?access_token=${access_token}&openid=${openid}&lang=zh_CN`);

// 5. 小程序获取手机号（需用户主动触发）
const phoneResponse = await fetch(`https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${access_token}`, {
  method: 'POST',
  body: JSON.stringify({ code: phoneCode })
});
```

#### 企业微信客户获取
```typescript
// 1. 获取客户列表
const customers = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/externalcontact/list?access_token=${access_token}&userid=销售ID`);

// 2. 获取客户详情
const customerDetail = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/externalcontact/get?access_token=${access_token}&external_userid=${external_userid}`);
```

---

### 2. 小红书

#### API现状
⚠️ **小红书API非常封闭**，官方开放平台主要面向品牌商家，普通企业较难申请API权限。

#### 实际获取方式

| 方式 | 可获取数据 | 说明 |
|------|-----------|------|
| 手动录入 | 私信内容、用户名 | 用户主动私信后手动记录 |
| 评论监控 | 评论内容、用户昵称 | 通过爬虫或第三方工具 |
| 笔记数据 | 点赞、收藏、评论数 | 第三方数据平台 |

#### 建议
```typescript
// 小红书线索获取建议：
// 1. 在笔记中引导用户私信或加微信
// 2. 使用二维码图片引流到微信
// 3. 手动录入系统或通过微信承接

// 模拟数据结构
const xhsLead = {
  source: 'xiaohongshu',
  source_content: '《创业必看：公司注册流程》笔记评论',
  name: '用户昵称',
  phone: '', // 通过私信沟通后获取
  note: '用户在笔记下评论咨询'
};
```

---

### 3. 知乎

#### API入口
- **知乎开放平台**：https://open.zhihu.com/

#### 可获取数据

| 数据类型 | 字段 | 说明 |
|----------|------|------|
| **回答/文章** | id | 内容ID |
| | title | 标题 |
| | voteup_count | 点赞数 |
| | comment_count | 评论数 |
| **评论** | id | 评论ID |
| | author.name | 作者名 |
| | content | 评论内容 |
| **私信** | content | 消息内容（需特殊权限） |

#### 对接方式
```typescript
// 知乎API权限也较难申请
// 实际场景多为内容营销 + 私信引导

// 获取回答评论（公开API）
const comments = await fetch(`https://www.zhihu.com/api/v4/answers/${answer_id}/comments?limit=20&offset=0`);

// 返回格式
/*
{
  "data": [
    {
      "id": "xxx",
      "author": { "name": "张三" },
      "content": "请问公司注册需要什么材料？",
      "created_time": 1640000000
    }
  ]
}
*/
```

---

## 三、搜索广告平台

### 1. 百度SEM（搜索推广）

#### API入口
- **百度营销中心**：https://marketing.baidu.com/
- **API文档**：https://dev2.baidu.com/

#### 可获取数据

| 数据类型 | 字段 | 说明 |
|----------|------|------|
| **搜索词** | query | 用户搜索词 |
| | keyword_id | 关键词ID |
| | keyword | 触发关键词 |
| **线索表单** | cluedetail_id | 线索ID |
| | name | 姓名 |
| | phone | 电话 |
| | extend_data | 扩展字段 |
| **来源追踪** | plan_id | 计划ID |
| | unit_id | 单元ID |
| | idea_id | 创意ID |
| | region | 地域 |

#### 对接方式

```typescript
// 1. 获取Access Token
const tokenResponse = await fetch('https://api.baidu.com/oauth/2.0/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: APP_ID,
    client_secret: APP_SECRET
  })
});

// 2. 获取线索数据
const cluesResponse = await fetch('https://api.baidu.com/json/sms/service/ClueService/getClueDetail', {
  method: 'POST',
  headers: {
    'Access-Token': access_token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clueDetailRequest: {
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    }
  })
});

// 返回格式
/*
{
  "body": {
    "data": [
      {
        "cluedetailId": "xxx",
        "name": "张三",
        "phone": "13812345678",
        "query": "长春代理记账",
        "keyword": "代理记账",
        "region": "吉林"
      }
    ]
  }
}
*/
```

---

### 2. 今日头条（巨量引擎）

#### API入口
- **巨量引擎开放平台**：https://open.oceanengine.com/

#### 可获取数据

| 数据类型 | 字段 | 说明 |
|----------|------|------|
| **线索表单** | clue_id | 线索ID |
| | name | 姓名 |
| | phone | 电话 |
| | custom_field | 自定义字段 |
| **来源追踪** | campaign_id | 计划ID |
| | ad_id | 广告ID |
| | creative_id | 创意ID |
| | keywords | 搜索关键词（搜索广告） |

#### 对接方式
```typescript
// 巨量引擎API与抖音共用同一套接口
// 因为都是字节跳动旗下产品

// 获取线索列表
const clues = await fetch('https://api.oceanengine.com/open_api/v1.0/qianchuan/clue/get/', {
  method: 'GET',
  headers: {
    'Access-Token': access_token
  },
  params: {
    advertiser_id: ADVERTISER_ID,
    start_date: '2024-01-01',
    end_date: '2024-01-31'
  }
});
```

---

### 3. 搜狗搜索

#### API入口
- **搜狗商业平台**：https://business.sogou.com/

#### 可获取数据
与百度SEM类似，包含搜索词、线索表单数据。

---

## 四、信息流广告平台

### 1. 腾讯广告（广点通）

#### API入口
- **腾讯广告投放平台**：https://e.qq.com/
- **API文档**：https://developers.e.qq.com/

#### 可获取数据

| 数据类型 | 字段 | 说明 |
|----------|------|------|
| **线索表单** | leads_id | 线索ID |
| | name | 姓名 |
| | phone | 电话 |
| | qq | QQ号 |
| | wechat | 微信号 |
| **来源追踪** | campaign_id | 计划ID |
| | adgroup_id | 广告组ID |
| | ad_id | 广告ID |
| | placement | 投放位置（朋友圈/QQ空间等） |

#### 对接方式
```typescript
// 1. 获取Access Token
const tokenResponse = await fetch('https://api.e.qq.com/oauth/token', {
  method: 'POST',
  body: JSON.stringify({
    client_id: APP_ID,
    client_secret: APP_SECRET,
    grant_type: 'client_credentials'
  })
});

// 2. 获取线索
const leads = await fetch(`https://api.e.qq.com/v1.3/leads/get?access_token=${access_token}`, {
  method: 'POST',
  body: JSON.stringify({
    account_id: ACCOUNT_ID,
    filtering: {
      start_date: '2024-01-01',
      end_date: '2024-01-31'
    }
  })
});
```

---

### 2. UC头条（阿里妈妈）

#### API入口
- **阿里妈妈**：https:// alimama.com/

#### 可获取数据
与其他信息流平台类似，包含线索表单和来源追踪数据。

---

## 五、本地生活平台

### 1. 大众点评/美团

#### API入口
- **美团开放平台**：https://open.meituan.com/

#### 可获取数据

| 数据类型 | 字段 | 说明 |
|----------|------|------|
| **店铺信息** | shop_id | 店铺ID |
| | shop_name | 店铺名称 |
| | address | 地址 |
| **评价** | review_id | 评价ID |
| | user_name | 用户名 |
| | content | 评价内容 |
| | rating | 评分 |
| **咨询** | content | 咨询内容 |

#### 对接方式
```typescript
// 需要是入驻商家才能申请API权限

// 获取店铺评价
const reviews = await fetch(`https://api.meituan.com/shop/reviews?shop_id=${shop_id}`, {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

---

### 2. 58同城

#### API入口
- **58开放平台**：https://open.58.com/

#### 可获取数据

| 数据类型 | 字段 | 说明 |
|----------|------|------|
| **线索** | clue_id | 线索ID |
| | contact | 联系人 |
| | phone | 电话 |
| | content | 咨询内容 |
| | post_id | 信息ID |

---

## 六、企业服务平台

### 1. 企查查

#### API入口
- **企查查开放平台**：https://open.qcc.com/

#### 可获取数据

| 数据类型 | 字段 | 说明 |
|----------|------|------|
| **企业信息** | name | 企业名称 |
| | regStatus | 经营状态 |
| | regCapital | 注册资本 |
| | legalPerson | 法人 |
| | contact | 联系方式 |
| **联系方式** | phone | 电话 |
| | email | 邮箱 |
| | address | 地址 |

#### 对接方式
```typescript
// 企查查主要用于获取企业联系方式，作为销售线索来源

// 搜索企业
const searchResult = await fetch(`https://api.qichacha.com/search/getSearchResult`, {
  headers: {
    'Authorization': `Bearer ${api_key}`,
    'Content-Type': 'application/json'
  },
  params: {
    searchKey: '长春代理记账',
    pageSize: 50
  }
});

// 获取企业联系方式
const contact = await fetch(`https://api.qichacha.com/company/getContacts`, {
  headers: { 'Authorization': `Bearer ${api_key}` },
  params: { keyNo: company_key }
});
```

---

### 2. 天眼查

#### API入口
- **天眼查开放平台**：https://open.tianyancha.com/

#### 可获取数据
与企查查类似，提供企业工商信息和联系方式。

---

## 七、数据汇总

### 各渠道API能力对比

| 渠道 | 线索API | 搜索词 | 来源追踪 | Webhook | 推荐接入方式 |
|------|---------|--------|----------|---------|-------------|
| 抖音 | ✅ | ✅ | ✅ | ✅ | API + Webhook |
| 快手 | ✅ | ✅ | ✅ | ✅ | API + Webhook |
| 视频号 | ⚠️ | ❌ | ⚠️ | ✅ | Webhook |
| B站 | ⚠️ | ❌ | ❌ | ❌ | 手动录入 |
| 微信公众号 | ✅ | ❌ | ❌ | ✅ | Webhook推送 |
| 微信小程序 | ✅ | ❌ | ❌ | ✅ | Webhook推送 |
| 企业微信 | ✅ | ❌ | ✅ | ✅ | API |
| 小红书 | ❌ | ❌ | ❌ | ❌ | 手动录入 |
| 知乎 | ⚠️ | ❌ | ❌ | ❌ | 手动/爬虫 |
| 百度SEM | ✅ | ✅ | ✅ | ✅ | API + Webhook |
| 今日头条 | ✅ | ✅ | ✅ | ✅ | API + Webhook |
| 腾讯广告 | ✅ | ❌ | ✅ | ✅ | API + Webhook |
| 大众点评 | ⚠️ | ❌ | ❌ | ✅ | API |
| 58同城 | ⚠️ | ❌ | ❌ | ❌ | 手动录入 |
| 企查查 | ✅ | ❌ | ❌ | ❌ | API（企业数据） |
| 天眼查 | ✅ | ❌ | ❌ | ❌ | API（企业数据） |

### 符号说明
- ✅ 完整支持
- ⚠️ 部分支持/权限难申请
- ❌ 不支持

---

## 八、统一接入架构建议

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           渠道统一接入层                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   【API轮询】                    【Webhook回调】                             │
│   ├── 抖音线索API                ├── 抖音线索推送                            │
│   ├── 快手线索API                ├── 微信消息推送                            │
│   ├── 百度SEM线索API             ├── 视频号消息推送                          │
│   ├── 企查查企业API              ├── 百度线索推送                            │
│   └── 定时任务每5分钟轮询         └── 实时接收并处理                          │
│                                                                             │
│   【手动录入】                  【Excel导入】                                │
│   ├── 小红书私信                 ├── 地推活动名单                            │
│   ├── 知乎咨询                   ├── 展会收集名片                            │
│   ├── B站私信                    └── 历史客户数据                            │
│   └── 电话咨询                                                               │
│                                                                             │
│                              ▼                                              │
│                                                                             │
│                    ┌─────────────────┐                                     │
│                    │   线索标准化处理  │                                     │
│                    │   • 字段映射      │                                     │
│                    │   • 数据清洗      │                                     │
│                    │   • 去重合并      │                                     │
│                    └─────────────────┘                                     │
│                              │                                              │
│                              ▼                                              │
│                    ┌─────────────────┐                                     │
│                    │   统一线索池      │                                     │
│                    └─────────────────┘                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 九、快速对接清单

### 优先级排序

| 优先级 | 渠道 | 原因 |
|--------|------|------|
| P0 | 抖音 | API成熟、流量大、线索质量高 |
| P0 | 百度SEM | 意向明确、转化率高 |
| P0 | 微信（公众号/企业微信） | 私域沉淀、持续跟进 |
| P1 | 今日头条 | 与抖音共用API，开发成本低 |
| P1 | 快手 | 短视频平台，用户群体下沉 |
| P1 | 腾讯广告 | 覆盖微信生态 |
| P2 | 视频号 | 微信生态内增长快 |
| P2 | 企查查/天眼查 | 主动获客、企业数据 |
| P3 | 小红书、知乎、B站 | 手动录入，内容营销为主 |

---

## 十、消息发送API（统一回复）

### 各平台消息发送能力

| 平台 | 主动发送 | 被动回复 | 条件限制 | 推荐程度 |
|------|----------|----------|----------|----------|
| **抖音** | ✅ | ✅ | 用户需先发起对话 | ⭐⭐⭐⭐⭐ |
| **微信公众号** | ✅ | ✅ | 48小时内有互动 | ⭐⭐⭐⭐⭐ |
| **微信小程序** | ✅ | ✅ | 用户需先发起对话 | ⭐⭐⭐⭐ |
| **企业微信** | ✅ | ✅ | 已添加客户好友 | ⭐⭐⭐⭐⭐ |
| **快手** | ✅ | ✅ | 用户需先发起对话 | ⭐⭐⭐⭐ |
| **视频号** | ⚠️ | ⚠️ | 通过微信生态间接支持 | ⭐⭐⭐ |
| **小红书** | ❌ | ❌ | API不开放私信 | ⭐ |
| **知乎** | ⚠️ | ⚠️ | 权限极难申请 | ⭐⭐ |
| **B站** | ⚠️ | ⚠️ | 需特殊权限 | ⭐⭐ |
| **百度SEM** | ❌ | ❌ | 无消息功能 | - |

### 符号说明
- ✅ 完整支持
- ⚠️ 部分支持/权限受限
- ❌ 不支持

---

### 抖音私信发送

```typescript
// 抖音私信发送API
// 文档：https://open.douyin.com/platform/doc/6848798466052376583

// 发送私信
const sendDouyinMessage = async (openId: string, content: string) => {
  const response = await fetch('https://open.douyin.com/api/douyin/v1/im/send_message/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Token': access_token
    },
    body: JSON.stringify({
      to_open_id: openId,          // 接收用户OpenID
      msg_type: 'text',            // 消息类型：text/image/card
      content: content,            // 消息内容
      access_token: access_token
    })
  });
  
  return response.json();
};

// 注意事项：
// 1. 用户必须先向企业发送过消息，才能主动回复
// 2. 每个用户每天最多接收50条主动消息
// 3. 支持文本、图片、卡片消息
```

---

### 微信公众号客服消息

```typescript
// 微信公众号客服消息API
// 文档：https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Service_Center_messages.html

// 发送客服消息
const sendWechatMessage = async (openid: string, content: string) => {
  const response = await fetch(`https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${access_token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      touser: openid,
      msgtype: 'text',
      text: {
        content: content
      }
    })
  });
  
  return response.json();
};

// 发送图文消息
const sendWechatNews = async (openid: string, articles: any[]) => {
  const response = await fetch(`https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${access_token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      touser: openid,
      msgtype: 'news',
      news: {
        articles: articles
      }
    })
  });
  
  return response.json();
};

// 注意事项：
// 1. 用户48小时内需有互动（发消息、点击菜单等）
// 2. 超过48小时需使用模板消息（需用户授权）
// 3. 模板消息每月有限额
```

---

### 微信小程序客服消息

```typescript
// 小程序客服消息API
// 文档：https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/customer-message/customerServiceMessage.send.html

const sendMiniProgramMessage = async (openid: string, content: string) => {
  const response = await fetch(`https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${access_token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      touser: openid,
      msgtype: 'text',
      text: {
        content: content
      }
    })
  });
  
  return response.json();
};

// 发送小程序卡片
const sendMiniProgramCard = async (openid: string) => {
  const response = await fetch(`https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${access_token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      touser: openid,
      msgtype: 'miniprogrampage',
      miniprogrampage: {
        title: '代理记账服务',
        appid: '小程序APPID',
        pagepath: '/pages/index/index',
        thumb_media_id: '封面图素材ID'
      }
    })
  });
  
  return response.json();
};
```

---

### 企业微信客户消息

```typescript
// 企业微信客户消息API（推荐，最灵活）
// 文档：https://developer.work.weixin.qq.com/document/path/92177

// 发送文本消息
const sendWeworkMessage = async (external_userid: string, content: string) => {
  const response = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/externalcontact/add_msg?access_token=${access_token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_type: 'single',          // 单聊
      external_userid: [external_userid],  // 客户ID列表
      sender: '销售员工ID',          // 发送者
      text: {
        content: content
      }
    })
  });
  
  return response.json();
};

// 发送小程序消息
const sendWeworkMiniProgram = async (external_userid: string) => {
  const response = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/externalcontact/add_msg?access_token=${access_token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_type: 'single',
      external_userid: [external_userid],
      sender: '销售员工ID',
      miniprogram: {
        appid: '小程序APPID',
        title: '代理记账服务介绍',
        page: '/pages/index/index'
      }
    })
  });
  
  return response.json();
};

// 注意事项：
// 1. 企业微信API最灵活，可主动发送消息给已添加的客户
// 2. 每个客户每天最多接收1条企业群发消息
// 3. 销售个人消息无限制
```

---

### 快手私信发送

```typescript
// 快手私信发送API
// 文档：https://open.kuaishou.com/document/develop

const sendKuaishouMessage = async (userId: string, content: string) => {
  const response = await fetch('https://open.kuaishou.com/openapi/private_message/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Token': access_token
    },
    body: JSON.stringify({
      to_user_id: userId,
      message_type: 1,    // 1-文本 2-图片
      content: content
    })
  });
  
  return response.json();
};
```

---

### 统一消息发送接口设计

```typescript
// 统一消息发送服务
interface SendMessageParams {
  platform: 'douyin' | 'wechat_mp' | 'wechat_mini' | 'wework' | 'kuaishou';
  userId: string;        // 平台用户标识
  content: string;       // 消息内容
  type?: 'text' | 'image' | 'card';  // 消息类型
}

class UnifiedMessageService {
  async send(params: SendMessageParams) {
    const { platform, userId, content, type = 'text' } = params;
    
    switch (platform) {
      case 'douyin':
        return await this.sendDouyin(userId, content);
      case 'wechat_mp':
        return await this.sendWechatMP(userId, content);
      case 'wechat_mini':
        return await this.sendWechatMini(userId, content);
      case 'wework':
        return await this.sendWework(userId, content);
      case 'kuaishou':
        return await this.sendKuaishou(userId, content);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
  
  private async sendDouyin(openId: string, content: string) {
    // 抖音发送逻辑
  }
  
  private async sendWechatMP(openId: string, content: string) {
    // 公众号发送逻辑
  }
  
  // ... 其他平台
}

// 使用示例
const messageService = new UnifiedMessageService();

// 统一回复抖音用户
await messageService.send({
  platform: 'douyin',
  userId: 'user_open_id',
  content: '您好，感谢您的咨询！'
});

// 统一回复微信公众号用户
await messageService.send({
  platform: 'wechat_mp',
  userId: 'oXXXXXXX',
  content: '您好，请问有什么可以帮您？'
});
```

---

### 自动回复规则配置

```typescript
// 自动回复规则存储结构
interface AutoReplyRule {
  id: string;
  platform: string;          // 适用平台
  keyword: string;           // 触发关键词
  match_type: 'exact' | 'contains' | 'regex';  // 匹配方式
  reply_content: string;     // 回复内容
  priority: number;          // 优先级
  enabled: boolean;          // 是否启用
}

// 自动回复处理
class AutoReplyService {
  private rules: AutoReplyRule[] = [];
  
  async processMessage(platform: string, userId: string, message: string) {
    // 查找匹配规则
    const rule = this.rules.find(r => 
      r.enabled && 
      r.platform === platform && 
      this.matchKeyword(message, r)
    );
    
    if (rule) {
      // 发送自动回复
      await messageService.send({
        platform: platform as any,
        userId,
        content: rule.reply_content
      });
      return true;
    }
    
    return false;
  }
  
  private matchKeyword(message: string, rule: AutoReplyRule): boolean {
    switch (rule.match_type) {
      case 'exact':
        return message === rule.keyword;
      case 'contains':
        return message.includes(rule.keyword);
      case 'regex':
        return new RegExp(rule.keyword).test(message);
    }
  }
}

// 配置示例
const autoReplyRules: AutoReplyRule[] = [
  {
    id: '1',
    platform: 'all',
    keyword: '价格',
    match_type: 'contains',
    reply_content: '代理记账小规模200元/月起，一般纳税人500元/月起，具体根据业务量定价~',
    priority: 1,
    enabled: true
  },
  {
    id: '2',
    platform: 'all',
    keyword: '材料',
    match_type: 'contains',
    reply_content: '公司注册需要：法人身份证、股东身份证、注册地址证明、公司章程等材料',
    priority: 2,
    enabled: true
  }
];
```

---

*文档创建时间：2026-01-16*
*最后更新：2026-01-16*
