# 纪念馆功能规格文档

## 一、需求概述

在「我的」页面中增加**纪念馆**入口，用户可进入纪念馆：

1. **我的纪念**：记录自己已逝去的宠物，支持新增纪念宠物卡片
2. **随机探访**：随机打开其他用户失去的宠物卡片，并为小动物留下祝福语（最多 100 字）

---

## 二、架构与技术方案

基于现有微信云开发（云数据库 + 云函数）架构进行扩展，新增以下内容：

- **2 个新数据库集合**：`memorial_pets`、`memorial_blessings`
- **1 个新云函数**：`memorialManage`
- **2 个新页面**：`memorial`（主页）、`memorial-add`（新增纪念宠物）
- **修改现有页面**：`profile` 中增加入口

---

## 三、数据库设计

### 3.1 `memorial_pets` — 纪念宠物集合

| 字段 | 类型 | 说明 |
|---|---|---|
| `_id` | String | 自动生成 |
| `_openid` | String | 云函数自动填写，创建者 openid |
| `petName` | String | 宠物名字 |
| `petAvatar` | String | 宠物头像（云存储 fileID） |
| `species` | String | 物种（狗/猫/兔/其他） |
| `gender` | String | 性别（male/female/unknown） |
| `birthday` | String | 出生日期（YYYY-MM-DD，可选） |
| `passDate` | String | 离开日期（YYYY-MM-DD） |
| `description` | String | 纪念寄语（可选） |
| `ownerNickName` | String | 主人昵称（冗余存储） |
| `ownerAvatar` | String | 主人头像（冗余存储） |
| `blessingsCount` | Number | 祝福数量（冗余计数，默认 0） |
| `createdAt` | Date | 创建时间 |

### 3.2 `memorial_blessings` — 祝福语集合

| 字段 | 类型 | 说明 |
|---|---|---|
| `_id` | String | 自动生成 |
| `_openid` | String | 云函数自动填写，留言者 openid |
| `memorialPetId` | String | 关联的 memorial_pets._id |
| `content` | String | 祝福语内容（最多 100 字） |
| `nickName` | String | 留言者昵称（冗余存储） |
| `avatarUrl` | String | 留言者头像（冗余存储） |
| `createdAt` | Date | 创建时间 |

---

## 四、云函数设计

### 云函数名：`memorialManage`

路径：`/Users/yuanlele/workspace/myWork/PawDiary/cloudfunctions/memorialManage/index.js`

支持的 `action`：

#### `add` — 新增纪念宠物

- 入参：`{ petName, petAvatar, species, gender, birthday, passDate, description }`
- 逻辑：自动填充 `_openid`、`ownerNickName`（查询 users 表）、`ownerAvatar`、`blessingsCount: 0`、`createdAt`
- 返回：`{ success: true, id }`

#### `list` — 获取自己的纪念宠物列表

- 入参：`{}`
- 逻辑：查询 `_openid == 当前用户` 的所有记录，按 `passDate` 降序
- 返回：`{ list: [...] }`

#### `getRandom` — 随机获取他人的纪念宠物

- 入参：`{ excludeIds: [] }` （已展示过的 id，避免重复，可选）
- 逻辑：
  1. 查询 `_openid != 当前用户` 的所有记录的 `_id`
  2. 从中排除 `excludeIds`，若剩余不足则重置
  3. 随机选取一条完整记录
  4. 同时查询该宠物最新的 5 条祝福语
- 返回：`{ pet: {...}, blessings: [...], total: N }`

#### `addBlessing` — 为纪念宠物添加祝福语

- 入参：`{ memorialPetId, content }`
- 逻辑：
  1. 校验 `content` 长度 ≤ 100 字
  2. 检查当前用户是否已为该宠物留言，若已留言则更新（覆盖）
  3. 向 `memorial_blessings` 插入记录，冗余 `nickName`/`avatarUrl`（查询 users 表）
  4. 更新 `memorial_pets.blessingsCount` +1（仅新增时）
- 返回：`{ success: true }`

#### `getBlessings` — 获取指定纪念宠物的祝福语列表

- 入参：`{ memorialPetId, limit: 20 }`
- 逻辑：查询 `memorialPetId` 对应的祝福语，按 `createdAt` 降序，取前 `limit` 条
- 返回：`{ blessings: [...] }`

---

## 五、页面设计

### 5.1 profile 页面修改

**文件：** `miniprogram/pages/profile/profile.wxml`

在 `.settings-section` 内的菜单组中，在现有菜单项前插入**纪念馆**入口项：

```xml
<view class="menu-item" bindtap="goMemorial">
  <text class="menu-icon">🕯️</text>
  <text class="menu-label">纪念馆</text>
  <image class="menu-arrow" src="/images/arrow-right.png" />
</view>
```

**文件：** `miniprogram/pages/profile/profile.js`

新增方法：
```js
goMemorial() {
  wx.navigateTo({ url: '/pages/memorial/memorial' });
}
```

---

### 5.2 `memorial` 主页面

**路径：** `miniprogram/pages/memorial/memorial`

**UI 结构：**

```
[自定义导航栏：纪念馆]
[Tab 切换：我的纪念 | 随机探访]

── 我的纪念 Tab ──
[新增纪念宠物按钮（+ 图标）]
[纪念宠物卡片列表]
  每张卡片：头像、宠物名、物种、离开日期、祝福数量
[空状态：暂无记录，引导新增]

── 随机探访 Tab ──
[随机宠物卡片]
  宠物头像（圆形）+ 宠物名 + 物种/性别
  主人昵称 + 离开日期
  纪念寄语（若有）
[已收到 N 条祝福]
[最近祝福列表（最多5条）]
[祝福输入框（placeholder: 为它写下祝福...，maxlength: 100）]
[字数统计：N/100]
[发送祝福按钮]
[换一个按钮（再随机一只）]
```

**data 数据结构：**
```js
{
  activeTab: 0,              // 0=我的纪念，1=随机探访
  myMemorials: [],           // 我的纪念列表
  randomPet: null,           // 当前随机宠物
  randomBlessings: [],       // 当前宠物的祝福列表
  blessingTotal: 0,          // 总祝福数
  blessingInput: '',         // 祝福输入内容
  blessingLength: 0,         // 输入字数
  excludedIds: [],           // 已展示过的 id（避免重复）
  loadingRandom: false,      // 随机加载中状态
  submitting: false          // 提交祝福中状态
}
```

---

### 5.3 `memorial-add` 新增纪念宠物页面

**路径：** `miniprogram/pages/memorial/memorial-add/memorial-add`

**UI 结构：**

```
[导航栏：记录 TA]
[宠物头像上传区（圆形，点击选图）]
[表单区]
  宠物名字（必填，input）
  物种（picker：狗/猫/兔/其他）
  性别（radio：公/母/不知道）
  出生日期（date picker，可选）
  离开日期（date picker，必填）
  纪念寄语（textarea，可选，placeholder: 说说它的故事...）
[提交按钮：记录 TA]
```

---

## 六、app.json 修改

在 `pages` 数组中新增两个路由：

```json
"pages/memorial/memorial",
"pages/memorial/memorial-add/memorial-add"
```

---

## 七、数据流路径

```
用户进入 profile 页
  → 点击「纪念馆」入口
    → navigateTo memorial 页
      ├── 我的纪念 Tab
      │     onShow → memorialManage.list → 渲染卡片列表
      │     点击「+」→ navigateTo memorial-add
      │           填写表单 → memorialManage.add → 返回列表刷新
      │
      └── 随机探访 Tab
            onTabChange → memorialManage.getRandom → 渲染随机卡片
            输入祝福语 → 实时统计字数（≤100）
            点击「发送祝福」→ memorialManage.addBlessing → 刷新祝福列表
            点击「换一个」→ memorialManage.getRandom（带 excludedIds）→ 新卡片
```

---

## 八、边界条件与异常处理

| 场景 | 处理方式 |
|---|---|
| 数据库中暂无他人纪念宠物 | 随机探访 Tab 展示空状态提示："还没有其他小天使，去添加自己的吧" |
| 所有他人宠物都已展示过 | 清空 `excludedIds` 重置，重新随机 |
| 祝福语超过 100 字 | 前端 `maxlength=100` 限制 + 云函数二次校验，提示"最多输入100个字" |
| 游客模式访问 | 随机探访可浏览，点击发送祝福时提示"请先登录后再留言" |
| 宠物头像上传失败 | 使用默认头像占位图，不阻塞提交 |
| 重复对同一宠物留言 | 覆盖之前的祝福（提示"已更新你的祝福"）|

---

## 九、影响文件汇总

| 文件类型 | 路径 | 操作 |
|---|---|---|
| 云函数 | `cloudfunctions/memorialManage/index.js` | 新建 |
| 云函数配置 | `cloudfunctions/memorialManage/package.json` | 新建 |
| 云函数配置 | `cloudfunctions/memorialManage/config.json` | 新建 |
| 页面 | `miniprogram/pages/memorial/memorial.{js,wxml,wxss,json}` | 新建 |
| 页面 | `miniprogram/pages/memorial/memorial-add/memorial-add.{js,wxml,wxss,json}` | 新建 |
| 全局配置 | `miniprogram/app.json` | 修改（新增路由） |
| 我的页面 | `miniprogram/pages/profile/profile.wxml` | 修改（新增入口） |
| 我的页面 | `miniprogram/pages/profile/profile.js` | 修改（新增跳转方法） |
