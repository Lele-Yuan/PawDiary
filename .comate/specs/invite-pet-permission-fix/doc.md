# 邀请页面加载其他用户宠物信息失败修复

## 问题描述

打开其他宠物的邀请页面时，控制台报错：
```
invite加载宠物信息失败 Error: document.get:fail cannot find document with _id xxx
```

## 根因分析

邀请页面 `invite.js` 第51行通过**客户端**直接调用 `db.collection('pets').doc(petId).get()` 获取宠物信息。微信云数据库默认权限规则为"仅创建者可读写"，当用户B尝试读取用户A创建的宠物文档时，会因权限不足而报 "cannot find document" 错误。

## 修复方案

将邀请页面的宠物信息获取从客户端直接查库改为调用云函数。云函数以管理员权限运行，不受客户端权限规则限制。

### 1. 在 `petManage` 云函数中新增 `get` action

- **文件**: `/Users/yuanlele/workspace/myWork/PawDiary/cloudfunctions/petManage/index.js`
- **修改类型**: 新增代码
- **影响函数**: `exports.main` (switch 中新增 case), 新增 `getPet()` 函数

新增的 `getPet` 函数逻辑：
```javascript
async function getPet(openid, data) {
  if (!data || !data._id) {
    return { code: -1, message: '缺少宠物ID' };
  }

  try {
    const res = await db.collection('pets').doc(data._id).get();
    return { code: 0, data: res.data };
  } catch (e) {
    return { code: -1, message: '宠物不存在或已失效' };
  }
}
```

在 `switch` 中新增：
```javascript
case 'get':
  return await getPet(OPENID, data);
```

### 2. 修改邀请页面 `loadPetInfo` 方法

- **文件**: `/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/invite/invite.js`
- **修改类型**: 修改现有代码
- **影响函数**: `loadPetInfo`

将原来的客户端直接查库：
```javascript
var petRes = await db.collection('pets').doc(petId).get();
var pet = petRes.data;
```

改为调用云函数：
```javascript
var petRes = await wx.cloud.callFunction({
  name: 'petManage',
  data: { action: 'get', data: { _id: petId } }
});
var pet = (petRes.result && petRes.result.code === 0) ? petRes.result.data : null;
```

同时移除函数开头不再需要的 `var db = wx.cloud.database();` 声明。

## 数据流路径

修复前: `invite.js` → 客户端 `db.collection('pets').doc(petId).get()` → 被权限规则拦截 → 报错

修复后: `invite.js` → `wx.cloud.callFunction('petManage', {action: 'get'})` → 云函数管理员权限读取 → 返回宠物数据

## 边界条件

- petId 为空: 已有参数校验，跳转首页
- 宠物文档不存在: 云函数 `getPet` 中 catch 错误返回 `code: -1`，前端显示"宠物不存在或已失效"
- 宠物已归档: 云函数仍会返回数据（status 为 archived），前端现有逻辑不做区分，保持不变

## 预期结果

任意用户打开其他用户宠物的邀请链接时，能正常加载并显示宠物信息页面。
