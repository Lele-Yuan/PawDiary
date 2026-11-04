# 来吃饭：历史小票成员昵称前显示头像设计

## 一、需求

历史小票（约饭小票详情页）的「当时成员」小节，当前仅以文字 chip 展示昵称。需在每个成员昵称前加上头像。

## 二、现状

`receipt.wxml` 的当时成员小节：

```
<view class="chips">
  <text wx:for="{{r.members}}" wx:key="userId" class="chip">{{item.nickName}}</text>
</view>
```

数据 `r.members` 来自 `buildReceipt` 返回的 `memberSnapshot`，每项为 `{userId, nickName, avatarUrl}`，头像字段已具备，无需改云函数。

## 三、方案（纯前端）

将每个成员由纯文字 chip 改为「头像 + 昵称」的成员胶囊：有 `avatarUrl` 显示头像图片，无则用昵称首字兜底（圆形紫色底），右侧跟昵称。`receipt.wxss` 新增成员胶囊与小头像样式（沿用紫色主题 `--c-primary`）。

## 四、受影响文件

- `miniprogram/pages/mealtime/receipt/receipt.wxml`：当时成员小节改为头像 + 昵称。
- `miniprogram/pages/mealtime/receipt/receipt.wxss`：新增成员胶囊/头像样式。

不改数据结构与云函数。

## 五、边界与预期

- 旧小票无 `members` 时该小节本就隐藏，不受影响。
- 无头像成员用昵称首字兜底。
- 预期：当时成员以「头像 + 昵称」形式展示。
