# 首页重构 & 宠物切换器迁移至个人中心

## 1. 需求场景

**用户请求：**
1. 首页按照新 Figma 设计稿进行调整——移除顶部宠物切换器，更新快捷入口区域
2. 将 `<pet-switcher>` 组件移动到「我的」页面（profile），放置在用户信息卡片下方

---

## 2. 当前状态分析

### 2.1 首页（home.wxml）

**当前结构：**
```
home-page
  ├── 无宠物引导视图
  └── 有宠物视图
       ├── pet-switcher（顶部宠物切换器）←【需要移除】
       ├── pet-card（当前宠物信息卡片）
       ├── quick-entry（快捷入口，2×2格子）
       ├── reminders-section（近期提醒）
       └── no-reminder（无提醒空态）
```

**需要变更：**
- 移除 `<pet-switcher>` 组件（lines 13-17）
- 移除与之关联的 `onSwitchPet` 绑定（已在 home.js 中，保留逻辑供 profile 页调用）
- 保留其余所有内容

### 2.2 个人中心（profile.wxml）

**当前结构：**
```
profile-page
  ├── user-card（用户信息卡片）
  ├── stats-card（统计数据：宠物数/记录数/账单数）
  ├── menu-section（功能菜单）
  ├── logout-section（退出登录）
  └── pet-list-modal（宠物列表弹窗）
```

**需要变更：**
- 在 `user-card` 之后、`stats-card` 之前插入 `<pet-switcher>` 组件
- 需要在 profile.js 中加载宠物列表数据（`pets`、`currentPetId`）
- 需要处理宠物切换逻辑（`onSwitchPet`）

---

## 3. 技术方案

### 3.1 首页变更

**home.wxml**：仅删除 pet-switcher 组件块（3行 wxml），其余内容不动。

```diff
- <!-- 宠物切换器 -->
- <pet-switcher
-   pets="{{pets}}"
-   currentPetId="{{currentPetId}}"
-   bind:switch="onSwitchPet"
- />
```

**home.wxss**：无需变更（已无 pet-switcher 相关样式）。

**home.js**：
- 保留 `pets`、`currentPetId`、`currentPet` 数据字段（pet-card 仍需要 `currentPet`）
- 保留 `onSwitchPet` 方法（profile 页的宠物切换会通过 `globalData` 更新；home 页在 `onShow` 时从 `globalData.currentPetId` 重新读取）
- `loadData()` 逻辑保持不变

### 3.2 个人中心变更

**profile.wxml**：在 user-card 和 stats-card 之间插入：

```xml
<!-- 我的宠物切换 -->
<pet-switcher
  wx:if="{{pets.length}}"
  pets="{{pets}}"
  currentPetId="{{currentPetId}}"
  bind:switch="onSwitchPet"
/>
```

**profile.json**：注册 pet-switcher 组件：
```json
{
  "usingComponents": {
    "pet-switcher": "/components/pet-switcher/pet-switcher"
  }
}
```

**profile.js**：
1. 在 `data` 中新增：`pets: [], currentPetId: ''`
2. 在 `onShow` 中调用 `this.loadPets()`
3. 新增 `loadPets()` 方法，从 DB 读取宠物列表，并从 `globalData.currentPetId` 获取当前选中宠物
4. 新增 `onSwitchPet(e)` 方法，同步更新 `globalData.currentPetId` 及本地 `currentPetId`

---

## 4. 受影响文件

| 文件 | 修改类型 | 具体变更 |
|------|---------|---------|
| `miniprogram/pages/home/home.wxml` | 删除 | 移除 `<pet-switcher>` 组件块（5行） |
| `miniprogram/pages/profile/profile.wxml` | 新增 | user-card 后插入 pet-switcher |
| `miniprogram/pages/profile/profile.json` | 新增 | 注册 pet-switcher usingComponents |
| `miniprogram/pages/profile/profile.js` | 修改 | 新增 pets/currentPetId 数据、loadPets()、onSwitchPet() |

**不需要变更的文件：**
- `home.js`（数据结构保持不变，onShow 已有 loadData 刷新）
- `home.wxss`（无 pet-switcher 相关样式）
- `pet-switcher` 组件本身（无需修改）

---

## 5. 数据流

```
profile onShow
  → loadPets()
      → DB query pets (status: active)
      → globalData.currentPetId → currentPetId
      → setData({ pets, currentPetId })
  
pet-switcher bind:switch → profile.onSwitchPet(e)
  → e.detail.petId
  → setData({ currentPetId })
  → globalData.currentPetId = petId
  → app.switchPet(petId)（可选，与 home.js 逻辑一致）

home onShow
  → loadData()
      → 从 globalData.currentPetId 获取当前宠物
      → pet-card 渲染不受影响
```

---

## 6. 边界条件

1. **无宠物时**：`pets.length === 0` 时 pet-switcher 不渲染（`wx:if="{{pets.length}}"`），个人中心正常显示其他内容
2. **profile 页已有 pets 数据**：`goMyPets()` 方法也会加载 pets 列表用于弹窗；两者共用同一 `pets` 字段，`loadPets()` 可复用已有逻辑（改造 `goMyPets` 或单独写 `loadPets`）
3. **宠物切换同步**：切换宠物后更新 `globalData.currentPetId`，当用户切换到首页时，`onShow → loadData()` 会重新读取 globalData，保证首页展示正确宠物
4. **pet-switcher 组件的 `onAddPet` 事件**：当前 home.js 中有 `onEditPet` 处理；profile 页也需绑定 `bind:edit` 以支持从 profile 跳转到宠物编辑页（可复用 home 中的逻辑）
