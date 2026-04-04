# 宠物管家微信小程序 — 需求设计文档

## 一、项目概述

### 1.1 项目定位
面向未知游客的一站式宠物生活管理微信小程序，帮助用户记录宠物成长、管理日常事务清单、追踪健康记录和消费账单。

### 1.2 技术方案
- **前端**：微信小程序原生开发（WXML + WXSS + JS）
- **后端**：微信云开发（CloudBase），包括云函数、云数据库、云存储
- **UI 风格**：清新可爱、圆角卡片风、以暖色调为主（主色 #FF8C69，辅色 #FFE4B5）

### 1.3 项目目录结构
```
miniprogram/
├── app.js                    # 小程序入口
├── app.json                  # 全局配置（tabBar 等）
├── app.wxss                  # 全局样式
├── project.config.json       # 项目配置
├── sitemap.json              # 站点地图
├── images/                   # 静态图片资源
│   ├── tab/                  # tabBar 图标
│   │   ├── home.png / home-active.png
│   │   ├── checklist.png / checklist-active.png
│   │   ├── record.png / record-active.png
│   │   ├── bill.png / bill-active.png
│   │   └── profile.png / profile-active.png
│   └── default/              # 默认占位图
│       ├── pet-avatar.png
│       └── empty.png
├── utils/                    # 工具函数
│   ├── util.js               # 通用工具（日期格式化、防抖等）
│   ├── cloud.js              # 云开发封装（统一调用入口）
│   └── constants.js          # 常量定义
├── components/               # 全局自定义组件
│   ├── pet-switcher/         # 宠物切换组件
│   ├── empty-state/          # 空状态占位组件
│   └── nav-bar/              # 自定义导航栏
├── pages/
│   ├── home/                 # 首页
│   │   ├── home.wxml / .wxss / .js / .json
│   │   └── components/
│   │       └── pet-card/     # 宠物信息卡片
│   ├── checklist/            # 清单
│   │   ├── checklist.wxml / .wxss / .js / .json
│   │   └── checklist-detail/ # 清单详情页
│   ├── record/               # 记录
│   │   ├── record.wxml / .wxss / .js / .json
│   │   └── record-add/       # 添加记录页
│   ├── bill/                 # 账单
│   │   ├── bill.wxml / .wxss / .js / .json
│   │   ├── bill-add/         # 添加账单页
│   │   └── bill-stats/       # 统计页
│   ├── profile/              # 个人中心
│   │   └── profile.wxml / .wxss / .js / .json
│   └── pet-edit/             # 添加/编辑宠物（共用）
│       └── pet-edit.wxml / .wxss / .js / .json
cloudfunctions/
├── login/                    # 登录云函数
├── petManage/                # 宠物管理云函数
├── checklistManage/          # 清单管理云函数
├── recordManage/             # 记录管理云函数
├── billManage/               # 账单管理云函数
└── userManage/               # 用户管理云函数
```

### 1.4 全局配置 — app.json 核心结构
底部 TabBar 共 5 个页签：首页、清单、记录、账单、个人中心。
```json
{
  "pages": [
    "pages/home/home",
    "pages/checklist/checklist",
    "pages/checklist/checklist-detail/checklist-detail",
    "pages/record/record",
    "pages/record/record-add/record-add",
    "pages/bill/bill",
    "pages/bill/bill-add/bill-add",
    "pages/bill/bill-stats/bill-stats",
    "pages/profile/profile",
    "pages/pet-edit/pet-edit"
  ],
  "tabBar": {
    "color": "#999",
    "selectedColor": "#FF8C69",
    "list": [
      { "pagePath": "pages/home/home", "text": "首页" },
      { "pagePath": "pages/checklist/checklist", "text": "清单" },
      { "pagePath": "pages/record/record", "text": "记录" },
      { "pagePath": "pages/bill/bill", "text": "账单" },
      { "pagePath": "pages/profile/profile", "text": "我的" }
    ]
  }
}
```

---

## 二、云数据库设计

### 2.1 用户表 `users`
| 字段           | 类型     | 说明                  |
|---------------|----------|----------------------|
| _id           | String   | 文档ID（自动生成）     |
| _openid       | String   | 用户openid（自动注入） |
| nickName      | String   | 昵称                  |
| avatarUrl     | String   | 头像URL               |
| phone         | String   | 手机号（可选）         |
| currentPetId  | String   | 当前选中的宠物ID       |
| createdAt     | Date     | 创建时间              |
| updatedAt     | Date     | 更新时间              |

### 2.2 宠物表 `pets`
| 字段           | 类型     | 说明                          |
|---------------|----------|------------------------------|
| _id           | String   | 文档ID                        |
| _openid       | String   | 所属用户                       |
| name          | String   | 宠物名称                       |
| avatar        | String   | 宠物头像（云存储fileID）         |
| species       | String   | 物种：cat / dog / other        |
| breed         | String   | 品种（如：金毛、布偶等）         |
| gender        | String   | 性别：male / female            |
| birthday      | Date     | 生日                           |
| adoptDate     | Date     | 领养/到家日期（用于计算陪伴天数）  |
| weight        | Number   | 当前体重（kg）                  |
| weightHistory | Array    | 体重记录 [{date, weight}]       |
| status        | String   | 状态：active / archived         |
| createdAt     | Date     | 创建时间                        |
| updatedAt     | Date     | 更新时间                        |

### 2.3 清单模板表 `checklist_templates`
| 字段           | 类型     | 说明                          |
|---------------|----------|------------------------------|
| _id           | String   | 文档ID                        |
| title         | String   | 清单标题（如"接宠物必备"）       |
| icon          | String   | 图标标识                       |
| description   | String   | 清单描述                       |
| items         | Array    | 默认清单项 [{name, category}]   |
| isSystem      | Boolean  | 是否系统预设                    |
| sortOrder     | Number   | 排序权重                       |

### 2.4 用户清单表 `checklists`
| 字段           | 类型     | 说明                            |
|---------------|----------|---------------------------------|
| _id           | String   | 文档ID                          |
| _openid       | String   | 所属用户                         |
| petId         | String   | 关联宠物ID                       |
| templateId    | String   | 来源模板ID（可为空表示自定义）     |
| title         | String   | 清单标题                         |
| icon          | String   | 图标标识                         |
| items         | Array    | 清单项 [{name, checked, note}]   |
| progress      | Number   | 完成进度（0-100，自动计算）        |
| createdAt     | Date     | 创建时间                         |
| updatedAt     | Date     | 更新时间                         |

### 2.5 健康记录表 `records`
| 字段           | 类型     | 说明                                        |
|---------------|----------|---------------------------------------------|
| _id           | String   | 文档ID                                       |
| _openid       | String   | 所属用户                                      |
| petId         | String   | 关联宠物ID                                    |
| type          | String   | 记录类型：deworm / checkup / vaccine / bath    |
| date          | Date     | 记录日期                                      |
| title         | String   | 标题（如"体内驱虫"、"第一针疫苗"等）             |
| description   | String   | 详细描述/备注                                  |
| location      | String   | 地点（如医院名称）                              |
| cost          | Number   | 花费金额                                      |
| nextDate      | Date     | 下次预计日期（用于提醒）                         |
| images        | Array    | 图片列表（云存储fileID）                        |
| createdAt     | Date     | 创建时间                                      |

### 2.6 账单表 `bills`
| 字段           | 类型     | 说明                                                  |
|---------------|----------|------------------------------------------------------|
| _id           | String   | 文档ID                                                |
| _openid       | String   | 所属用户                                               |
| petId         | String   | 关联宠物ID                                             |
| amount        | Number   | 金额（元）                                              |
| category      | String   | 分类：food / medical / toy / grooming / daily / other    |
| title         | String   | 消费描述                                                |
| date          | Date     | 消费日期                                                |
| note          | String   | 备注                                                   |
| createdAt     | Date     | 创建时间                                                |

---

## 三、功能模块详细设计

### 3.1 首页模块 (`pages/home/home`)

#### 3.1.1 页面布局
从上到下依次包含：
1. **顶部区域**：宠物切换器（横向滑动显示宠物头像列表，最右侧有"+"按钮添加宠物）
2. **宠物信息卡片**：展示当前选中宠物的核心信息
   - 宠物头像（圆形大图）
   - 宠物名称 + 品种标签
   - 性别图标 + 年龄
   - 陪伴天数（从 adoptDate 到今天）
   - 当前体重（带小趋势图标：上升/下降/持平）
3. **快捷功能入口**：四宫格按钮 → 快速跳转到"清单"、"记录"、"账单"、"体重记录"
4. **近期提醒卡片**：展示最近待处理的事项（即将到期的驱虫/疫苗/体检提醒），来源于 records 表中 nextDate 最近的前3条

#### 3.1.2 交互逻辑
- **切换宠物**：点击顶部宠物头像切换，同时更新 users 表的 currentPetId，页面所有数据刷新
- **添加宠物**：点击"+"跳转 `pages/pet-edit/pet-edit?mode=add`
- **编辑宠物**：长按宠物信息卡片，跳转 `pages/pet-edit/pet-edit?mode=edit&id=xxx`

#### 3.1.3 关键代码逻辑

**宠物切换器组件** (`components/pet-switcher/`)：
```javascript
// pet-switcher.js
Component({
  properties: {
    pets: { type: Array, value: [] },
    currentPetId: { type: String, value: '' }
  },
  methods: {
    onSelectPet(e) {
      const petId = e.currentTarget.dataset.id;
      this.triggerEvent('switch', { petId });
    },
    onAddPet() {
      wx.navigateTo({ url: '/pages/pet-edit/pet-edit?mode=add' });
    }
  }
});
```

**首页数据加载**：
```javascript
// home.js
Page({
  data: {
    pets: [],
    currentPet: null,
    companionDays: 0,
    upcomingReminders: []
  },
  onShow() {
    this.loadPets();
  },
  async loadPets() {
    const db = wx.cloud.database();
    const { data: pets } = await db.collection('pets')
      .where({ status: 'active' })
      .orderBy('createdAt', 'asc')
      .get();
    
    // 获取当前选中宠物
    const { data: [user] } = await db.collection('users').where({}).limit(1).get();
    const currentPetId = user?.currentPetId || pets[0]?._id;
    const currentPet = pets.find(p => p._id === currentPetId) || pets[0];
    
    // 计算陪伴天数
    let companionDays = 0;
    if (currentPet?.adoptDate) {
      const diff = Date.now() - new Date(currentPet.adoptDate).getTime();
      companionDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    }
    
    this.setData({ pets, currentPet, companionDays });
    this.loadReminders(currentPetId);
  },
  async loadReminders(petId) {
    const db = wx.cloud.database();
    const _ = db.command;
    const now = new Date();
    const { data: reminders } = await db.collection('records')
      .where({
        petId,
        nextDate: _.gte(now)
      })
      .orderBy('nextDate', 'asc')
      .limit(3)
      .get();
    this.setData({ upcomingReminders: reminders });
  }
});
```

**陪伴天数计算 WXML**：
```xml
<!-- home.wxml -->
<view class="companion-card">
  <image class="pet-avatar" src="{{currentPet.avatar || '/images/default/pet-avatar.png'}}" mode="aspectFill" />
  <view class="pet-name">{{currentPet.name}}</view>
  <view class="pet-breed">{{currentPet.breed}}</view>
  <view class="companion-days">
    <text class="days-number">{{companionDays}}</text>
    <text class="days-label">天陪伴</text>
  </view>
  <view class="pet-weight">
    <text class="weight-value">{{currentPet.weight}}</text>
    <text class="weight-unit">kg</text>
  </view>
</view>
```

---

### 3.2 清单模块 (`pages/checklist/checklist`)

#### 3.2.1 系统预设清单模板
系统内置以下清单模板（存入 `checklist_templates`），用户首次使用时自动生成：

| 清单名称       | 图标  | 默认项目                                                |
|--------------|------|--------------------------------------------------------|
| 🏠 接宠物必备  | home | 猫粮/狗粮、食碗水碗、猫砂/尿垫、航空箱、玩具、牵引绳、项圈、驱虫药、宠物沐浴露  |
| 🥾 徒步必备    | hike | 牵引绳、水壶水碗、零食、拾便袋、急救包、防蚊喷雾、雨衣、脚套       |
| 🏥 去医院必备  | hospital | 病历本、疫苗本、航空箱、尿垫、零食（安抚用）、牵引绳、毛巾      |
| ✈️ 出行必备    | travel | 航空箱/车载笼、粮食、折叠碗、牵引绳、疫苗证明、狂犬证、玩具、尿垫  |

用户可基于模板创建自己的清单实例，也可新建完全自定义清单。

#### 3.2.2 页面布局
1. **顶部**：当前宠物标签 + "新建清单"按钮
2. **清单卡片列表**：每张卡片包含
   - 图标 + 清单标题
   - 进度条（已勾选 / 总数）
   - 进度百分比文字
   - 右侧箭头进入详情
3. 底部留白

#### 3.2.3 清单详情页 (`checklist-detail`)
- 标题编辑区（可修改清单名称）
- 清单项列表：每项一个 checkbox + 名称 + 可选备注
- 底部"添加新项目"输入框
- 支持长按删除单项，左滑删除
- 实时计算并更新进度

#### 3.2.4 关键代码逻辑

**清单列表页**：
```javascript
// checklist.js
Page({
  data: {
    checklists: [],
    currentPetId: ''
  },
  onShow() {
    const app = getApp();
    this.setData({ currentPetId: app.globalData.currentPetId });
    this.loadChecklists();
  },
  async loadChecklists() {
    const db = wx.cloud.database();
    const { data } = await db.collection('checklists')
      .where({ petId: this.data.currentPetId })
      .orderBy('createdAt', 'desc')
      .get();
    
    // 计算每个清单的进度
    const checklists = data.map(cl => ({
      ...cl,
      progress: cl.items.length > 0 
        ? Math.round(cl.items.filter(i => i.checked).length / cl.items.length * 100) 
        : 0,
      checkedCount: cl.items.filter(i => i.checked).length,
      totalCount: cl.items.length
    }));
    this.setData({ checklists });
  },
  async createFromTemplate(e) {
    const templateId = e.currentTarget.dataset.templateId;
    await wx.cloud.callFunction({
      name: 'checklistManage',
      data: { action: 'createFromTemplate', templateId, petId: this.data.currentPetId }
    });
    this.loadChecklists();
  }
});
```

**清单详情页-勾选逻辑**：
```javascript
// checklist-detail.js
async toggleItem(e) {
  const index = e.currentTarget.dataset.index;
  const items = this.data.checklist.items;
  items[index].checked = !items[index].checked;
  
  const progress = Math.round(items.filter(i => i.checked).length / items.length * 100);
  
  const db = wx.cloud.database();
  await db.collection('checklists').doc(this.data.checklist._id).update({
    data: { items, progress, updatedAt: new Date() }
  });
  
  this.setData({ 'checklist.items': items, 'checklist.progress': progress });
}
```

---

### 3.3 记录模块 (`pages/record/record`)

#### 3.3.1 记录类型定义
| 类型标识     | 显示名称 | 图标颜色  | 说明                    |
|------------|---------|----------|------------------------|
| deworm     | 驱虫    | #4CAF50  | 体内/体外驱虫记录         |
| checkup    | 体检    | #2196F3  | 常规体检、专项检查         |
| vaccine    | 疫苗    | #FF9800  | 各类疫苗接种记录          |
| bath       | 洗澡    | #9C27B0  | 洗澡/美容记录            |

#### 3.3.2 页面布局
1. **顶部标签筛选栏**：全部 / 驱虫 / 体检 / 疫苗 / 洗澡（横向滑动tab）
2. **时间线列表**：按日期倒序展示记录卡片
   - 左侧时间线圆点（颜色对应类型）
   - 卡片内容：类型标签 + 标题 + 日期 + 地点 + 金额
   - 如有 nextDate 则显示"下次：xxxx-xx-xx"提醒标签
3. **右下角悬浮按钮**："+ 添加记录"

#### 3.3.3 添加记录页 (`record-add`)
表单字段：
- 记录类型（必选，四选一按钮组）
- 日期（必选，日期选择器，默认今天）
- 标题（必填，如"体内驱虫-大宠爱"）
- 详细描述（选填，多行文本）
- 地点（选填，如"xxx宠物医院"）
- 花费（选填，数字输入）
- 下次预计日期（选填，日期选择器，用于提醒）
- 图片上传（选填，最多9张）

#### 3.3.4 关键代码逻辑

**记录列表加载**：
```javascript
// record.js
Page({
  data: {
    activeType: 'all',
    records: [],
    typeList: [
      { key: 'all', label: '全部' },
      { key: 'deworm', label: '驱虫' },
      { key: 'checkup', label: '体检' },
      { key: 'vaccine', label: '疫苗' },
      { key: 'bath', label: '洗澡' }
    ]
  },
  async loadRecords() {
    const db = wx.cloud.database();
    const app = getApp();
    let query = { petId: app.globalData.currentPetId };
    if (this.data.activeType !== 'all') {
      query.type = this.data.activeType;
    }
    const { data } = await db.collection('records')
      .where(query)
      .orderBy('date', 'desc')
      .limit(50)
      .get();
    this.setData({ records: data });
  },
  switchType(e) {
    this.setData({ activeType: e.currentTarget.dataset.type });
    this.loadRecords();
  }
});
```

**添加记录-提交**：
```javascript
// record-add.js
async submitRecord() {
  const { type, date, title, description, location, cost, nextDate, images } = this.data.form;
  if (!type || !date || !title) {
    return wx.showToast({ title: '请填写必填项', icon: 'none' });
  }
  
  // 上传图片到云存储
  const uploadedImages = [];
  for (const img of images) {
    const res = await wx.cloud.uploadFile({
      cloudPath: `records/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
      filePath: img
    });
    uploadedImages.push(res.fileID);
  }
  
  const db = wx.cloud.database();
  const app = getApp();
  await db.collection('records').add({
    data: {
      petId: app.globalData.currentPetId,
      type, date: new Date(date), title, description,
      location, cost: Number(cost) || 0,
      nextDate: nextDate ? new Date(nextDate) : null,
      images: uploadedImages,
      createdAt: new Date()
    }
  });
  
  wx.showToast({ title: '记录成功' });
  setTimeout(() => wx.navigateBack(), 1500);
}
```

---

### 3.4 账单模块 (`pages/bill/bill`)

#### 3.4.1 消费分类定义
| 分类标识     | 显示名称 | 图标   | 说明                |
|------------|---------|--------|---------------------|
| food       | 粮食    | 🍖     | 主粮、零食、营养品     |
| medical    | 医疗    | 💊     | 看病、体检、驱虫、疫苗  |
| toy        | 玩具    | ??     | 玩具、猫爬架等         |
| grooming   | 美容    | ✂️     | 洗澡、美容、剪指甲     |
| daily      | 日用    | 🧹     | 猫砂、尿垫、牵引绳等    |
| other      | 其他    | 📦     | 其他消费              |

#### 3.4.2 页面布局
1. **顶部月份选择器**：左右箭头切换月份，显示"2026年3月"
2. **月度概览卡片**：
   - 本月总支出金额（大字）
   - 与上月对比（增/减百分比）
   - 各分类占比的环形图 / 条形图
3. **账单流水列表**：按日期分组，每条显示
   - 分类图标 + 消费标题
   - 金额（红色）
   - 日期
4. **右下角悬浮按钮**："+ 记一笔"

#### 3.4.3 统计页面 (`bill-stats`)
- 月度/年度切换
- 分类饼图（使用 wx-charts 或 echarts-miniprogram）
- 分类排行列表（按金额降序）
- 月度趋势折线图（近6个月）

#### 3.4.4 关键代码逻辑

**月度账单加载**：
```javascript
// bill.js
Page({
  data: {
    currentYear: 2026,
    currentMonth: 3,
    monthTotal: 0,
    lastMonthTotal: 0,
    bills: [],
    categoryStats: []
  },
  async loadMonthBills() {
    const db = wx.cloud.database();
    const _ = db.command;
    const app = getApp();
    const { currentYear, currentMonth } = this.data;
    
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 1);
    
    const { data: bills } = await db.collection('bills')
      .where({
        petId: app.globalData.currentPetId,
        date: _.gte(startDate).and(_.lt(endDate))
      })
      .orderBy('date', 'desc')
      .get();
    
    const monthTotal = bills.reduce((sum, b) => sum + b.amount, 0);
    
    // 分类统计
    const categoryMap = {};
    bills.forEach(b => {
      categoryMap[b.category] = (categoryMap[b.category] || 0) + b.amount;
    });
    const categoryStats = Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount, percent: Math.round(amount / monthTotal * 100) }))
      .sort((a, b) => b.amount - a.amount);
    
    this.setData({ bills, monthTotal, categoryStats });
  },
  prevMonth() {
  