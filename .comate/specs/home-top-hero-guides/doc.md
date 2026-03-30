# 首页顶部通顶改版与指南模块设计

## 需求概述
本次改动聚焦微信小程序首页视觉结构调整，目标是让首页顶部宠物信息区域改为从屏幕顶部自然延伸的 Hero 形式，不再依赖原生导航栏背景色来营造顶部色块；同时将快捷入口改为参考设计图中“宠物登记 / 状态查询”那类圆形图标入口样式，并在快捷入口下方新增“养猫指南”“养狗指南”双卡片模块，视觉参考设计图中的“宠物领养”模块。

本次改动属于首页样式重构，尽量不改变现有数据来源与页面跳转逻辑：
- 宠物数据仍来自 `pets` 集合，由首页 `loadData` 加载
- 快捷入口仍沿用现有 `goChecklist`、`goRecord`、`goBill`、`goEditWeight` 方法
- 新增指南模块先做静态展示，不新增页面路由和云函数

---

## 场景与处理逻辑

### 场景 1：首页顶部宠物信息改为通到顶部的 Hero 结构
当前首页使用原生导航栏，颜色由全局 `navigationBarBackgroundColor` 控制，宠物卡片只是页面首个内容块，顶部没有与状态栏打通。改造后首页需要关闭原生导航栏，只在首页使用自定义沉浸式头部布局：
- 首页页面配置改为 `navigationStyle: "custom"`
- 在 `home.js` 初始化时读取 `statusBarHeight`
- 将 `statusBarHeight` 传给 `pet-card` 组件
- `pet-card` 自身负责为顶部安全区预留间距，使 Hero 背景从最顶部开始，内容落在安全区域下方

处理原则：
- 只改首页，不影响其他页面现有导航样式
- 保留当前宠物信息展示逻辑、年龄计算逻辑、陪伴天数逻辑
- 继续保留长按编辑宠物能力，避免这次视觉改版顺带改变交互约定

### 场景 2：快捷入口样式改为圆形图标行
当前快捷入口是 2×2 大色块卡片，和参考图不一致。改造后需要变成单行 4 项图标入口，每项由圆形图标容器 + 标签组成。

处理原则：
- 保留现有 4 个入口及跳转逻辑，不变更业务含义
- 使用现有 emoji 或轻量文本图标，不新增图片资源
- 入口背景仍放在白色卡片容器中，但整体更轻、更扁平

### 场景 3：新增“养猫指南 / 养狗指南”模块
在快捷入口下方新增双卡片模块，参考设计图中“宠物领养”模块的体块关系和圆角卡片形式。

处理原则：
- 放置在快捷入口和近期提醒之间，保证首页信息层级清晰
- 先做静态视觉区块，不绑定跳转，避免虚构页面目标
- 两张卡片采用柔和浅色背景与右下装饰图形/emoji，形成内容型模块视觉区隔

### 场景 4：无宠物状态的顶部留白适配
首页在没有宠物时会显示引导态。由于首页关闭原生导航栏，无宠物态也必须补齐顶部安全区间距，避免内容被状态栏压住。

处理原则：
- 无宠物引导容器增加动态顶部内边距
- 不重写无宠物态结构，只做安全区与留白适配

---

## 技术方案

### 1. 首页改为仅首页自定义导航样式
在 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/home.json` 中增加：

```json
{
  "navigationStyle": "custom"
}
```

这样首页不再显示原生导航栏，顶部背景将完全由页面内容控制。全局 `/Users/yuanlele/workspace/comate_error/miniprogram/app.json` 中的 `navigationBarBackgroundColor` 不做修改，因为它仍服务于其他未自定义导航的页面。

### 2. 首页注入安全区高度
在 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/home.js` 中：
- 新增 `statusBarHeight` 到 `data`
- 在 `onLoad` 里调用 `wx.getSystemInfoSync()` 读取 `statusBarHeight`
- 设置默认兜底值，避免极端设备取值异常

示意代码：

```js
onLoad() {
  const systemInfo = wx.getSystemInfoSync();
  this.setData({
    statusBarHeight: systemInfo.statusBarHeight || 20
  });
}
```

### 3. 顶部宠物模块改为通顶 Hero Banner
`pet-card` 组件保持数据来源不变，但重写结构和样式，使其承担首页 Hero 的视觉主体：
- 外层去掉上圆角，保留底部大圆角
- 顶部内边距 = 安全区高度 + 额外标题间距
- 左侧展示宠物名称、品种/年龄、统计信息
- 右侧展示宠物头像
- 背景改为大面积柔和渐变，并增加装饰圆形

推荐结构示意：

```xml

<view class="pet-hero" style="padding-top: {{statusBarHeight}}px;">
  <view class="hero-content">
    <view class="hero-copy">
      <view class="hero-caption">宠物管家</view>
      <view class="hero-name">{{pet.name}}</view>
      <view class="hero-meta">
        <text wx:if="{{pet.breed}}">{{pet.breed}}</text>
        <text wx:if="{{pet.breed && age}}"> · </text>
        <text wx:if="{{age}}">{{age}}</text>
      </view>
      <view class="hero-stats">
        <view class="hero-stat">...</view>
        <view class="hero-stat">...</view>
      </view>
    </view>
    <image class="hero-avatar" ... />
  </view>
</view>
```

样式策略：
- 使用暖色渐变背景，和当前全局色板一致
- 顶部贴边、底部圆角 `0 0 56rpx 56rpx`
- 保持头像、文字、统计块的层级对比
- 不新增额外图片资源，完全由现有字段与 CSS 表现完成

### 4. 快捷入口改为单行圆形功能入口
首页 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/home.wxml` 中将当前 2×2 网格结构重写为 4 项横向入口：

```xml

<view class="quick-entry card">
  <view class="entry-grid">
    <view class="entry-item" bindtap="goChecklist">
      <view class="entry-icon entry-icon-brown">📋</view>
      <view class="entry-label">清单</view>
    </view>
    ...
  </view>
</view>
```

样式策略：
- 使用 `display: flex` 或 4 列 grid 让四项横向均分
- 图标容器为正圆
- 标签居中，整体高度明显小于现有 2×2 色块
- 保留白底卡片容器，减少视觉重量

### 5. 新增指南双卡片模块
在首页快捷入口之后、近期提醒之前新增：

```xml

<view class="guide-links">
  <view class="guide-link guide-link-cat">
    <view class="guide-link-title">养猫指南</view>
    <view class="guide-link-desc">了解猫咪养护知识</view>
    <view class="guide-link-deco">🐱</view>
  </view>
  <view class="guide-link guide-link-dog">
    <view class="guide-link-title">养狗指南</view>
    <view class="guide-link-desc">狗狗养育完全手册</view>
    <view class="guide-link-deco">🐶</view>
  </view>
</view>
```

样式策略：
- 双列布局
- 左右卡片配不同浅色底
- 标题加粗，副文案弱化
- 装饰元素靠右下角，控制透明度，避免影响信息识别

---

## 受影响文件

### 必改文件
1. `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/home.json`
   - 修改类型：页面配置调整
   - 影响点：增加 `navigationStyle: "custom"`

2. `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/home.js`
   - 修改类型：页面数据与生命周期补充
   - 影响函数：新增 `onLoad`，扩展 `data`
   - 影响点：读取并保存 `statusBarHeight`

3. `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/home.wxml`
   - 修改类型：页面结构调整
   - 影响点：
     - 为无宠物态容器增加动态顶部样式
     - 给 `pet-card` 传递 `statusBarHeight`
     - 重写快捷入口结构
     - 新增“养猫指南 / 养狗指南”模块

4. `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/home.wxss`
   - 修改类型：页面样式重写/新增
   - 影响点：
     - 调整首页整体上间距策略
     - 新版快捷入口样式
     - 新增指南模块样式
     - 为无宠物态补充安全区留白

5. `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/components/pet-card/pet-card.wxml`
   - 修改类型：组件结构重写
   - 影响点：重排 Hero 内部文案、头像、统计区布局

6. `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/components/pet-card/pet-card.wxss`
   - 修改类型：组件样式重写
   - 影响点：通顶 Hero 渐变背景、圆角、安全区、装饰图形、统计块样式

7. `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/components/pet-card/pet-card.js`
   - 修改类型：组件属性扩展
   - 影响点：新增 `statusBarHeight` 属性，保留现有观察逻辑与长按编辑逻辑

### 不改但需要确认兼容性的文件
1. `/Users/yuanlele/workspace/comate_error/miniprogram/app.json`
   - 不计划修改
   - 原因：全局导航栏配置仍供其他页面使用

2. `/Users/yuanlele/workspace/comate_error/miniprogram/app.wxss`
   - 原则上不修改
   - 原因：首页本次样式变更可在页面级样式中完成，避免影响全局卡片体系

---

## 实现细节

### 数据流路径
1. `home.js` 在页面加载时读取 `statusBarHeight`
2. `home.wxml` 将 `statusBarHeight` 作为属性传给 `pet-card`
3. `pet-card` 根据该值计算顶部内边距，生成通顶 Hero 头部
4. `loadData()` 继续加载 `pets` 和 `currentPet`
5. `pet-card` 继续通过 `pet` 属性展示宠物名称、品种、年龄、陪伴天数、体重
6. 快捷入口仍直接调用 `home.js` 内既有跳转方法
7. 指南模块仅渲染静态内容，不参与现有数据流

### 样式层级策略
- 首页分为：Hero 顶部区 → 快捷入口 → 指南卡片 → 提醒列表
- Hero 作为页面最强视觉主体，使用大面积暖色渐变
- 快捷入口降低体量，作为功能导航层
- 指南模块用轻色块承接，形成内容推荐层
- 提醒列表继续保留信息卡片风格，保证既有业务内容可读性

### 兼容性策略
- 安全区高度使用系统值 + 默认兜底值
- 组件仅新增属性，不改变原有 `pet` 数据结构
- 无宠物态也应用顶部安全区，避免页面首屏结构不一致
- 不新增图片素材与路由，减少回归风险

---

## 边界条件与异常处理
- 当 `statusBarHeight` 读取失败时，使用兜底值，确保顶部不会遮挡
- 当 `currentPet` 为 `null` 时，不渲染 `pet-card`，维持当前首页逻辑
- 当宠物缺少 `breed` 或年龄为空时，Hero 副标题需避免出现多余分隔符
- 当宠物没有头像时，继续使用默认头像 `/images/default/pet-avatar.png`
- “养猫指南 / 养狗指南”不绑定点击逻辑，避免跳转到不存在的页面
- 快捷入口布局需兼容较窄屏幕，四项内容不能出现明显换行错位

---

## 预期结果
- 首页顶部宠物信息区域从屏幕最顶端开始展示，视觉上取代原先依赖导航栏背景色的头部色块
- 快捷入口从 2×2 大卡片改为更接近参考图的圆形图标入口样式
- 首页新增“养猫指南 / 养狗指南”双卡片模块，增强内容层次
- 现有宠物加载、提醒加载、快捷入口跳转逻辑保持可用
- 改动范围限制在首页与首页子组件内，不影响其他 tab 页和编辑页的导航表现
