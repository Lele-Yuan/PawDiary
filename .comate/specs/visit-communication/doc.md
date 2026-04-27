# 上门沟通功能设计文档

## 一、需求场景

铲屎官或临时主均可发起「上门沟通」，发起时选择自己的角色。创建后将记录分享给对方，对方打开后自动绑定为另一角色。双方共同编辑和确认服务细节，跟踪状态直至完成。

---

## 二、入口

`miniprogram/pages/profile/profile.wxml` — 在「客服反馈」前新增「上门沟通」快捷图标项。

---

## 三、页面路由

| 页面 | 路径 | 说明 |
|------|------|------|
| 沟通历史列表 | `pages/visit/visit` | 展示本人参与的所有沟通记录 |
| 新建/编辑 | `pages/visit/visit-add/visit-add` | 表单页，`?editId=xxx` 编辑模式 |

---

## 四、数据模型

集合：`visit_records`

```js
{
  _openid: String,            // 创建者 openid（微信云函数自动写入）
  creatorRole: String,        // 创建者角色：'owner'（铲屎官）或 'helper'（临时主）
  ownerOpenid: String,        // 铲屎官的 openid（创建时若为 owner 则填入 _openid）
  helperOpenid: String,       // 临时主的 openid（创建时若为 helper 则填入 _openid）
  ownerNickname: String,      // 铲屎官昵称
  helperNickname: String,     // 临时主昵称
  serviceName: String,        // 服务名称（默认「上门喂猫」）
  visitTimes: [               // 上门时间列表（支持多个）
    { date: String, time: String }
  ],
  location: {
    address: String,          // 具体门牌号/地址说明
    latitude: Number,
    longitude: Number
  },
  pets: [                     // 宠物信息（支持多个）
    { nickname: String, type: String, specialNeeds: String }
  ],
  message: String,            // 补充留言（双方可见，最多200字）
  ownerNote: String,          // 铲屎官私密备注（仅铲屎官可见）
  helperNote: String,         // 临时主私密备注（仅临时主可见）
  ownerConfirmed: Boolean,    // 铲屎官是否已确认
  helperConfirmed: Boolean,   // 临时主是否已确认
  status: String,             // 见状态机：pending / preparing / serving / completed / archived
  createdAt: Date,
  updatedAt: Date
}
```

### 创建时角色绑定逻辑

| 创建者选择角色 | ownerOpenid | helperOpenid |
|--------------|-------------|--------------|
| 我是铲屎官 | `_openid` | `null` |
| 我是临时主 | `null` | `_openid` |

对方通过分享链接打开后，自动将当前 openid 填入空缺的那个字段（ownerOpenid 或 helperOpenid）。

---

## 五、状态机

```
新建
  │
  ▼
pending（待确认）── 创建者废弃 ──→ archived（已废弃）
  │
  │ 双方均点击「确认」
  ▼
preparing（准备中）── 创建者废弃 ──→ archived（已废弃）
  │
  │ 临时主点击「已上门」
  ▼
serving（服务中）
  │
  │ 铲屎官点击「确认完成」
  ▼
completed（已完成）
```

| status | 中文 | 触发条件 |
|--------|------|----------|
| `pending` | 待确认 | 新建默认 |
| `preparing` | 准备中 | ownerConfirmed && helperConfirmed 均为 true |
| `serving` | 服务中 | 临时主点击「已上门」 |
| `completed` | 已完成 | 铲屎官点击「确认完成」 |
| `archived` | 已废弃 | 创建者在 pending 或 preparing 状态下废弃；serving 及之后不可废弃 |

状态标签颜色：
- `pending` → 橙色 #E8875A
- `preparing` → 蓝色 #5B8DEF
- `serving` → 紫色 #9B7FE8
- `completed` → 绿色 #5BC47A

---

## 六、权限规则

### 身份识别

云函数通过当前用户 openid 与记录字段对比确定身份：
- `openid === ownerOpenid` → 铲屎官
- `openid === helperOpenid` → 临时主
- 以上均不匹配 → 无权限

### 访问控制

| 场景 | 规则 |
|------|------|
| `ownerOpenid` 或 `helperOpenid` 有一个为 null | 任何人可通过分享链接访问并自动绑定到空缺角色 |
| 双方均已绑定 | 仅 ownerOpenid / helperOpenid 可查看，其他人返回 `NO_PERMISSION` |
| `completed` 状态 | 双方只读，无法再编辑 |

> 一旦两个 openid 都已绑定，分享链接对第三方完全关闭，前端展示「暂无权限查看此记录」。

### 编辑权限

- 铲屎官和临时主在 `pending` / `preparing` 状态下均可编辑表单所有公开字段
- 私密备注仅本人可读写：铲屎官仅见 `ownerNote`，临时主仅见 `helperNote`
- `serving` 和 `completed` 状态下表单变为只读

---

## 七、云函数 visitManage

新建 `cloudfunctions/visitManage/`，支持以下 action：

| action | 说明 |
|--------|------|
| `add` | 新建沟通记录，按 creatorRole 初始化 ownerOpenid 或 helperOpenid，返回 `_id` |
| `list` | 查询我参与的记录（ownerOpenid 或 helperOpenid 等于当前 openid）|
| `get` | 获取单条记录：若有空缺 openid 则自动绑定当前用户；双方已绑定后仅本人可访问（否则返回 `NO_PERMISSION`）；按身份过滤私密备注 |
| `update` | 双方均可更新表单内容（仅 pending/preparing 状态）|
| `confirm` | 当前用户标记已确认，ownerConfirmed/helperConfirmed → true；双方均 true 则 status → preparing |
| `checkin` | 临时主点击已上门，status → serving |
| `complete` | 铲屎官确认完成，status → completed |
| `delete` | 废弃记录（仅创建者，且 status 为 pending 或 preparing），status → archived |

---

## 八、页面详细设计

### 8.1 历史列表页

- nav-bar 标题「上门沟通」，右侧「新建」按钮
- 列表卡片：服务名称、状态标签（色块）、第一个上门时间、双方昵称
- 空状态引导创建
- 卡片点击跳转 `?editId=xxx`

### 8.2 表单页（新建 / 编辑）

> 非参与方访问时，云函数返回 `NO_PERMISSION`，前端展示「暂无权限查看此记录」，隐藏所有表单内容。

**⓪ 我的角色**（仅新建时展示，编辑后不可修改）
- 单选：「我是铲屎官 🏠」 / 「我是临时主 🐾」
- 决定创建后昵称字段的归属和分享文案

**① 服务简介**
- 铲屎官昵称（输入）
- 临时主昵称（输入）
- 新建时当前用户昵称自动填入对应角色的昵称字段
- 服务名称（输入，默认「上门喂猫」）

**② 上门时间**（动态列表）
- 每条：日期 picker + 时间 picker + 「×」删除
- 「+ 添加时间」按钮

**③ 具体位置**
- `wx.chooseLocation()` 选地图坐标 + 地址展示
- 文本输入具体门牌号

**④ 宠物信息**（动态列表）
- 每条：昵称、类型、特殊需求 + 「×」删除
- 「+ 添加宠物」按钮

**⑤ 补充留言**
- textarea，最多200字，双方可见

**⑥ 我的备注**（仅本人可见）
- 铲屎官看到 `ownerNote`，临时主看到 `helperNote`
- 灰底标注「仅自己可见」

**底部状态操作区**

| 状态 | 铲屎官操作 | 临时主操作 |
|------|-----------|-----------|
| pending | 「保存」 + 「确认信息」 + 「废弃」（创建者） | 「保存」 + 「确认信息」 + 「废弃」（创建者） |
| preparing | 「保存」 + 「废弃」（创建者） | 「保存」 + 「已上门」 + 「废弃」（创建者） |
| serving | 「确认完成」 | 无操作 |
| completed | 只读 | 只读 |

> 「废弃」按钮仅对创建者（`_openid`）在 pending / preparing 状态下显示，点击需二次确认。

- 新建时底部有「保存并分享」按钮，保存后触发 `onShareAppMessage`

---

## 九、分享逻辑

分享文案根据创建者角色动态生成：

```js
onShareAppMessage() {
  const isOwner = creatorRole === 'owner';
  return {
    title: isOwner
      ? `${ownerNickname} 邀请您作为临时主上门照看宠物 · ${serviceName}`
      : `${helperNickname} 发起了上门照看宠物沟通 · ${serviceName}`,
    path: `/pages/visit/visit-add/visit-add?editId=${recordId}`,
    imageUrl: '/images/guide/illust-main.png'
  };
}
```

对方打开后云函数自动将其 openid 绑定到空缺角色（ownerOpenid 或 helperOpenid）。

---

## 十、受影响文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `miniprogram/app.json` | 修改 | 注册 visit、visit-add 路由 |
| `miniprogram/pages/profile/profile.wxml` | 修改 | 在客服反馈前插入入口图标 |
| `miniprogram/pages/profile/profile.js` | 修改 | 增加 `goToVisit()` 方法 |
| `miniprogram/pages/visit/visit.js/wxml/wxss/json` | 新增 | 历史列表页（4文件） |
| `miniprogram/pages/visit/visit-add/visit-add.js/wxml/wxss/json` | 新增 | 表单页（4文件） |
| `cloudfunctions/visitManage/index.js` | 新增 | 云函数（8个 action）|
| `cloudfunctions/visitManage/config.json` | 新增 | 云函数配置 |
| `cloudfunctions/visitManage/package.json` | 新增 | 云函数依赖 |
