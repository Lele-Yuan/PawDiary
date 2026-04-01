# 我的毛孩子模块显示创建和加入的宠物

## 问题描述

加入其他人的宠物家庭后，在"我的毛孩子"列表中看不到加入的宠物。只显示自己创建的宠物。

## 根因分析

`profile.js` 的 `loadPets()` 方法直接通过客户端 `db.collection('pets').where({ status: 'active' }).get()` 查询，微信云数据库默认权限规则只返回当前用户创建的文档（`_openid` 匹配），因此加入的其他人的宠物不会出现在结果中。

`home.js` 虽然有查询 `pet_members` 获取加入宠物的逻辑，但后续用客户端 `db.collection('pets').where({ _id: _cmd.in(extraIds) })` 查询他人宠物数据时，同样会被权限规则静默过滤为空结果。

## 修复方案

### 1. 改造 `petManage` 云函数的 `list` action

- **文件**: `/Users/yuanlele/workspace/myWork/PawDiary/cloudfunctions/petManage/index.js`
- **修改类型**: 修改现有函数 `listPets`
- **影响函数**: `listPets(openid)`

改造后的逻辑（与 `home.js` 中的逻辑类似，但在云函数中执行，不受权限限制）：
1. 查询自己创建的活跃宠物，标记 role 为对应 `pet_members` 中的角色（通常是 `creator`）
2. 查询 `pet_members` 获取当前用户加入的所有宠物 ID 和角色
3. 筛选出非自己创建的宠物 ID，查询对应的宠物文档
4. 合并两个列表，每个宠物对象附带 `role` 字段（`creator` / `admin` / `member`）
5. 为没有 `pet_members` 记录的自有宠物自动补建 `creator` 记录

```javascript
async function listPets(openid) {
  // 1. 查询自己创建的活跃宠物
  const { data: ownPets } = await db.collection('pets').where({
    _openid: openid,
    status: 'active'
  }).orderBy('createdAt', 'asc').get();

  // 2. 查询 pet_members 获取角色映射
  const { data: members } = await db.collection('pet_members')
    .where({ _openid: openid })
    .get();
  var roleMap = {};
  var joinedPetIds = [];
  for (var i = 0; i < members.length; i++) {
    roleMap[members[i].petId] = members[i].role;
    joinedPetIds.push(members[i].petId);
  }

  // 3. 为自有宠物标记角色，补建缺失的 creator 记录
  var ownIdSet = {};
  for (var j = 0; j < ownPets.length; j++) {
    var pid = ownPets[j]._id;
    ownIdSet[pid] = true;
    ownPets[j].role = roleMap[pid] || 'creator';
    if (!roleMap[pid]) {
      // 异步补建，不阻塞主流程
      db.collection('pet_members').add({
        data: {
          _openid: openid,
          petId: pid,
          role: 'creator',
          createdAt: new Date()
        }
      }).catch(function() {});
    }
  }

  // 4. 查询加入但非自己创建的宠物
  var extraIds = [];
  for (var k = 0; k < joinedPetIds.length; k++) {
    if (!ownIdSet[joinedPetIds[k]]) {
      extraIds.push(joinedPetIds[k]);
    }
  }
  var joinedPets = [];
  if (extraIds.length > 0) {
    const { data: extraPets } = await db.collection('pets')
      .where({ _id: _.in(extraIds), status: 'active' })
      .get();
    for (var m = 0; m < extraPets.length; m++) {
      extraPets[m].role = roleMap[extraPets[m]._id] || 'member';
    }
    joinedPets = extraPets;
  }

  // 5. 合并返回
  return { code: 0, data: ownPets.concat(joinedPets) };
}
```

### 2. 修改 `profile.js` 的 `loadPets()` 和 `goMyPets()` 

- **文件**: `/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/profile/profile.js`
- **修改类型**: 修改现有代码
- **影响函数**: `loadPets()`, `goMyPets()`

将客户端直接查库改为调用云函数：

```javascript
async loadPets() {
  try {
    const app = getApp();
    const res = await wx.cloud.callFunction({
      name: 'petManage',
      data: { action: 'list' }
    });
    const pets = (res.result && res.result.code === 0) ? res.result.data : [];

    let currentPetId = app.globalData.currentPetId;
    if (!currentPetId || !pets.find(p => p._id === currentPetId)) {
      currentPetId = pets.length ? pets[0]._id : '';
      if (currentPetId) app.globalData.currentPetId = currentPetId;
    }

    this.setData({ pets, currentPetId });
  } catch (err) {
    console.error('加载宠物列表失败：', err);
  }
}
```

`goMyPets()` 同理改为调用云函数。

### 3. 修改 `profile.wxml` 添加角色标签

- **文件**: `/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/profile/profile.wxml`
- **修改类型**: 修改现有代码

在宠物卡片的名字旁添加角色标签，区分"创建者"和"已加入"：

```xml
<view class="pet-card-info">
  <view class="pet-card-name-row">
    <text class="pet-card-name">{{item.name}}</text>
    <text class="pet-role-tag pet-role-joined" wx:if="{{item.role === 'member'}}">已加入</text>
  </view>
  <text class="pet-card-desc">{{item.breed || '未知品种'}}{{item.age ? ' · ' + item.age + '岁' : ''}}</text>
</view>
```

仅对 `member` 角色显示"已加入"标签，`creator` 和 `admin` 不显示标签（即默认是自己的宠物）。

### 4. 添加角色标签样式

- **文件**: `/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/profile/profile.wxss`
- **修改类型**: 新增样式

```css
.pet-card-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 6rpx;
}

.pet-card-name-row .pet-card-name {
  margin-bottom: 0;
}

.pet-role-tag {
  font-size: 20rpx;
  font-weight: 600;
  padding: 2rpx 12rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
}

.pet-role-joined {
  background-color: rgba(190, 235, 231, 0.5);
  color: #2E5956;
}
```

### 5. 同步修复 `home.js` 的 `loadData()` 中共享宠物获取逻辑

- **文件**: `/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/home/home.js`
- **修改类型**: 修改现有代码
- **影响函数**: `loadData()`

将 `loadData()` 中获取宠物列表的部分也改为调用 `petManage` 云函数的 `list` action，替换当前客户端直接查库的逻辑（lines 93-144），解决共享宠物在首页也无法正确加载的问题。

## 数据流路径

修复前: `profile.js` → 客户端 `db.collection('pets')` → 只返回自己创建的宠物

修复后: `profile.js` → `wx.cloud.callFunction('petManage', {action: 'list'})` → 云函数管理员权限查询 `pets` + `pet_members` → 返回所有关联宠物（含 role）

## 边界条件

- 用户未加入任何宠物：`pet_members` 无记录，`extraIds` 为空，只返回自有宠物
- 用户只有加入的宠物没有创建的：`ownPets` 为空，只返回 `joinedPets`
- 宠物已归档：`status: 'active'` 过滤，不会出现在列表中
- `pet_members` 记录缺失：自有宠物自动补建 `creator` 记录

## 预期结果

"我的毛孩子"列表同时显示用户创建的和加入的宠物，加入的宠物名字旁显示"已加入"标签以区分。
