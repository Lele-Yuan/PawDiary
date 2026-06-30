# 宠物友好地点 - 平台管理员专属权限

## 需求场景
当前「宠物友好地点」（pet_places）任何已登录用户都可新增/编辑/删除，存在 UGC 治理风险。本次改造将地点的 **新增 / 编辑 / 删除** 全部收敛为「平台管理员」专属能力，普通用户仅保留浏览与查看。

## 技术方案

### 管理员识别
- 在 `users` 集合新增字段 `role`：取值 `'admin'` 或 `undefined`（普通用户）
- 由开发者通过云开发控制台手动给指定 `_openid` 的用户加上 `role: 'admin'`，无后台 UI
- `userManage` 的 `loginOrRegister` / `getUserInfo` / `updateUser` 返回 `users` 完整记录（已经返回 `data: users[0]`，因此 role 字段会自动透传）
- 小程序前端缓存到 `app.globalData.userInfo.role`，登录后即可用

### 云端鉴权（mapManage）
所有写操作云函数加入「管理员校验」前置：
```javascript
async function requireAdmin(openid) {
  var u = await db.collection('users').where({ _openid: openid }).limit(1).get();
  if (!u.data.length || u.data[0].role !== 'admin') return false;
  return true;
}
```
- `addPlace`：进入函数即校验，非 admin 返回 `{ code: -403, message: '仅管理员可操作' }`
- `updatePlace`：移除原本「仅创建者可编辑」逻辑，改为「仅管理员可编辑」
- `deletePlace`：同上

> 注：写操作鉴权放在云端是硬约束；前端隐藏只是 UX，绕过前端调用云函数依然会被拒绝。

### 前端隐藏入口
- `miniprogram/pages/map/map.wxml`：两处 `goAddPlace` 按钮（empty-state 的"添加地点"按钮、右下角 fab `+`）外层包 `wx:if="{{isAdmin}}"`
- `miniprogram/pages/map/place-detail/place-detail.wxml`：将 `wx:if="{{isOwner}}"` 改为 `wx:if="{{isAdmin}}"`，编辑/删除按钮统一靠 admin 控制
- `map.js` / `place-detail.js`：在 `onShow` 中从 `app.globalData.userInfo.role` 读取并 `setData({ isAdmin: role === 'admin' })`
- `place-add.js`：页面 `onLoad` 时也加一道兜底校验，非 admin 直接 Toast「仅管理员可操作」并返回上一页（防止用户通过分享/历史栈直达）

## 影响文件
| 路径 | 修改类型 | 关键变更 |
|---|---|---|
| `cloudfunctions/mapManage/index.js` | 修改 | 新增 `requireAdmin`；addPlace / updatePlace / deletePlace 前置鉴权；删除 updatePlace/deletePlace 中"仅本人"的旧校验 |
| `miniprogram/pages/map/map.wxml` | 修改 | 两处添加按钮包 `wx:if="{{isAdmin}}"` |
| `miniprogram/pages/map/map.js` | 修改 | onShow 注入 isAdmin |
| `miniprogram/pages/map/place-detail/place-detail.wxml` | 修改 | 编辑/删除条件由 isOwner 改 isAdmin |
| `miniprogram/pages/map/place-detail/place-detail.js` | 修改 | onShow 注入 isAdmin（保留 isOwner 用于其他展示场景） |
| `miniprogram/pages/map/place-add/place-add.js` | 修改 | onLoad 兜底鉴权 |

## 边界与异常
- **未登录用户**：`userInfo` 为空，`isAdmin = false`，按钮隐藏，符合预期
- **管理员降级**：手动将 `role` 字段去除后，下一次 `getUserInfo`/`login` 即可同步；本地缓存最长 1 次冷启动延迟
- **绕过前端直接调云函数**：云端 `requireAdmin` 兜底，返回 -403
- **现有数据兼容**：已存在的 pet_places 不动；普通用户原先创建的地点仍可被管理员管理（updatePlace/deletePlace 不再依赖 _openid 匹配）
- **内容安全**：之前接入的 msgSecCheck / imgSecCheck 保留，admin 提交内容同样要过审

## 预期效果
- 普通用户：进入地图页看不到"添加地点"按钮，详情页看不到"编辑/删除"按钮
- 管理员：完整看到入口，可正常新增/编辑/删除任意地点
- 任意人直接调云函数 add/update/delete：被拒绝（-403）
