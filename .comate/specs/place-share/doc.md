# 地点分享功能设计文档

## 需求场景

用户在查看宠物友好地点详情时，可以一键将该地点分享给微信好友，分享标题自动拼接为  
**「{用户昵称}喊你到{地点名称}遛狗去」**，让好友点击即可直接进入该地点详情页。

---

## 技术方案

### 微信分享机制

微信小程序提供两种分享触发方式：

| 方式 | 说明 |
|------|------|
| 右上角菜单「转发」 | 调用 `wx.showShareMenu` + 实现 `onShareAppMessage` 即可激活 |
| 页面内自定义按钮 | `<button open-type="share">` 触发同一个 `onShareAppMessage` |

本功能同时启用两种方式：用户既可通过右上角菜单分享，也可点击页面内的「喊狗友遛狗」按钮分享。

### 分享内容组装

```javascript
onShareAppMessage() {
  var userInfo = getApp().globalData.userInfo;
  var nickName = (userInfo && userInfo.nickName) || '一位狗友';
  var place = this.data.place;
  return {
    title: nickName + '喊你到' + place.name + '遛狗去',
    path: '/pages/map/place-detail/place-detail?id=' + place._id,
    imageUrl: (place.images && place.images[0]) || ''   // 云存储 fileID，微信会自动处理；无图时留空使用默认截图
  };
}
```

- **title**：动态拼接，最多 80 字
- **path**：直接落地到地点详情页，`id` 参数即可
- **imageUrl**：优先使用地点第一张图，无图时传空字符串（微信使用页面截图兜底）

### 激活右上角分享菜单

在详情数据加载完成后调用：

```javascript
wx.showShareMenu({ withShareTicket: false, menus: ['shareAppMessage'] });
```

---

## 受影响文件

| 文件 | 类型 | 变更内容 |
|------|------|----------|
| `miniprogram/pages/map/place-detail/place-detail.js` | 修改 | 新增 `onShareAppMessage`；在 `setData` 成功后调用 `wx.showShareMenu` |
| `miniprogram/pages/map/place-detail/place-detail.wxml` | 修改 | 在底部新增「喊狗友遛狗」分享按钮（`open-type="share"`） |
| `miniprogram/pages/map/place-detail/place-detail.wxss` | 修改 | 新增分享按钮样式 |

---

## 边界条件与异常处理

| 场景 | 处理方式 |
|------|----------|
| 用户昵称为空 | 降级为「一位狗友」 |
| 地点图片为空 | `imageUrl` 传 `''`，微信自动用页面截图 |
| 地点数据未加载完成时点击按钮 | 按钮仅在 `loaded && place` 为真时渲染，不会触发 |
| 好友通过分享链接进入 | 传入 `id` 参数，`place-detail.js` 的 `onLoad` 已能正确处理 |

---

## 数据流

```
用户点击「喊狗友遛狗」按钮
  → 触发 onShareAppMessage
    → 读取 getApp().globalData.userInfo.nickName
    → 读取 this.data.place.name / _id / images[0]
    → 返回 { title, path, imageUrl }
      → 微信弹出分享选择器
        → 好友点击分享卡片
          → 小程序以 /pages/map/place-detail/place-detail?id=xxx 启动
            → place-detail.js onLoad 正常加载详情
```

---

## 预期效果

- 分享卡片标题：`张三喊你到幸福公园遛狗去`
- 分享路径：直达该地点详情页
- 视觉：底部固定一个橙色「🐕 喊狗友遛狗」全宽按钮，不覆盖创建者操作按钮区域
