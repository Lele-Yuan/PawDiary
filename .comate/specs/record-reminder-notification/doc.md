# 日常记录下次提醒消息通知实现方案

## 一、背景与现状

当前「下次提醒」功能是**纯前端 UI 展示**：
- 数据库存储 `enableRemind`、`remindInterval`、`nextDate` 三个字段
- 用户打开 App 才能看到进度条、剩余天数
- 没有任何系统级消息推送能力

目标：当用户开启「下次提醒」后，在 `nextDate` 当天（或提前 1 天）向用户推送微信消息通知。

---

## 二、技术方案：微信订阅消息

微信小程序官方唯一合规的消息推送机制是**订阅消息（subscribeMessage）**：
- 用户主动订阅后，开发者可在 7 天内（一次性订阅）或长期（长期订阅，需审核）发送通知
- 通过云函数调用微信 `subscribeMessage.send` 接口发送

### 整体流程

```
用户开启"下次提醒"
       ↓
前端调用 wx.requestSubscribeMessage（获取用户授权）
       ↓
将 openid + templateId + nextDate 存入数据库（reminders 集合）
       ↓
定时云函数每天执行：查询当天 nextDate 的记录
       ↓
调用微信 subscribeMessage.send API 发送通知
       ↓
用户微信收到服务通知消息
```

---

## 三、各模块实现细节

### 3.1 申请消息模板

在微信公众平台（mp.weixin.qq.com）→「功能」→「订阅消息」中申请模板。

**推荐使用的公共模板**（宠物护理提醒类）：

| 模板用途 | 建议关键词 |
|---------|----------|
| 宠物护理提醒 | 提醒事项、提醒时间、宠物名称、备注 |
| 待办提醒通知 | 任务名称、截止时间、描述 |

申请后得到 `templateId`（如：`ZuML7GbjCpKkV5ZvAy1BSvxTa0ns0RhPEZrAGa5MnG8`），配置到项目 `utils/constants.js` 中：

```js
// utils/constants.js 新增
const NOTIFY_TEMPLATE_ID = 'YOUR_TEMPLATE_ID_HERE';
```

### 3.2 前端：提醒时间配置 UI

开启「下次提醒」后，在表单中新增两个配置项：

**数据结构新增字段**（`form` 对象）：

```js
form: {
  // ...已有字段
  enableRemind: false,
  nextDate: '',
  remindInterval: 0,

  // 新增：提醒时间配置
  remindAdvance: 0,      // 提前天数：0=当天，1=前一天
  remindTime: '08:00',   // 具体提醒时间，默认 08:00
}
```

**WXML 新增 UI**（`record-add/record-add.wxml`，在"下次提醒"开关之后）：

```xml
<!-- 提前天数选择：当天 / 前一天 -->
<view class="form-group" wx:if="{{form.enableRemind}}">
  <view class="form-label">提醒时间</view>
  <view class="remind-advance-tabs">
    <view class="tab-item {{form.remindAdvance === 0 ? 'active' : ''}}"
      bindtap="onRemindAdvanceChange" data-val="{{0}}">当天</view>
    <view class="tab-item {{form.remindAdvance === 1 ? 'active' : ''}}"
      bindtap="onRemindAdvanceChange" data-val="{{1}}">前一天</view>
  </view>
</view>

<!-- 具体时间点选择（HH:mm） -->
<view class="form-group" wx:if="{{form.enableRemind}}">
  <picker mode="time" value="{{form.remindTime}}" bindchange="onRemindTimeChange">
    <view class="picker-display">
      <text>{{form.remindTime || '08:00'}}</text>
      <text class="picker-arrow">›</text>
    </view>
  </picker>
</view>
```

**JS 事件处理**（`record-add/record-add.js`）：

```js
onRemindAdvanceChange(e) {
  this.setData({ 'form.remindAdvance': e.currentTarget.dataset.val });
},
onRemindTimeChange(e) {
  this.setData({ 'form.remindTime': e.detail.value });
},
```

### 3.3 前端：点击保存时请求订阅授权

**触发时机**：用户点击「保存」按钮（`onSave` 函数）时，若 `enableRemind: true`，则先调用 `wx.requestSubscribeMessage` 获取授权，授权完成后再提交保存。

```js
// record-add.js - onSave 修改
async onSave() {
  if (this.data.form.enableRemind) {
    // 先请求订阅授权，授权后再保存
    await new Promise((resolve) => {
      wx.requestSubscribeMessage({
        tmplIds: [NOTIFY_TEMPLATE_ID],
        complete: () => resolve()  // 无论同意/拒绝都继续保存流程
      });
    });
  }
  // 继续原有保存逻辑...
  this.submitRecord();
}
```

**注意**：
- `wx.requestSubscribeMessage` 必须由用户点击行为触发，`onSave` 本身由 tap 事件驱动，符合规范
- 用户拒绝授权时不阻断保存，记录仍可正常保存，只是无法收到推送
- `complete` 回调（而非 `success`）确保无论用户是否同意都执行后续保存

### 3.3 数据库：记录订阅信息

保存提醒记录时，在 `recordManage` 云函数的 `addRecord` / `updateRecord` 中，将 `openid` 已经存储，无需新增字段（`recordData._openid` 已有）。

但需要确认记录中有 `enableRemind: true` 的情况下，`openid` 可被定时通知函数读取。现有数据结构已满足：

```js
// 现有 recordData 结构（已满足需求）
{
  _openid: openid,          // 用于定向推送
  petId: data.petId,
  nextDate: new Date(data.nextDate),   // 通知触发日期
  enableRemind: data.enableRemind,     // true 时需要推送
  type: data.type,
  title: data.title,
  // ...
}
```

### 3.4 新建云函数：sendReminder（消息发送 + 定时触发）

**文件**：`cloudfunctions/sendReminder/index.js`

**功能**：
1. 查询当天 `nextDate` 且 `enableRemind: true` 的所有记录
2. 对每条记录，通过微信 `cloud.openapi.subscribeMessage.send` 发送通知
3. 发送成功后，将该记录的 `enableRemind` 置为 `false`，防止重复发送

```js
// cloudfunctions/sendReminder/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const db = cloud.database();
  const _ = db.command;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 1. 查询今天需要提醒的记录
  const { data: records } = await db.collection('records')
    .where({
      enableRemind: true,
      nextDate: _.gte(today).and(_.lt(tomorrow))
    })
    .get();

  const results = [];
  for (const record of records) {
    try {
      // 2. 发送订阅消息
      await cloud.openapi.subscribeMessage.send({
        touser: record._openid,
        templateId: 'YOUR_TEMPLATE_ID_HERE',
        page: `pages/record/record?petId=${record.petId}`,
        data: {
          thing1: { value: record.title || getRecordTypeLabel(record.type) },
          time2:  { value: formatDate(record.nextDate) },
          thing3: { value: record.petName || '你的宠物' },
          thing4: { value: '点击查看详情' }
        }
      });

      // 3. 标记已发送，关闭 enableRemind
      await db.collection('records').doc(record._id).update({
        data: { enableRemind: false }
      });

      results.push({ id: record._id, status: 'sent' });
    } catch (err) {
      results.push({ id: record._id, status: 'failed', error: err.message });
    }
  }

  return { code: 0, total: records.length, results };
};
```

**配置定时触发器**：

`cloudfunctions/sendReminder/config.json`：

```json
{
  "triggers": [
    {
      "name": "dailyReminder",
      "type": "timer",
      "config": "0 0 8 * * * *"
    }
  ]
}
```

> 每天早上 8:00 自动执行（Cron 表达式）。

### 3.5 云函数权限配置

在微信云开发控制台，为 `sendReminder` 云函数开启以下权限：
- `wx.openapi` → `subscribeMessage.send`（在云函数配置中添加权限）

`cloudfunctions/sendReminder/package.json` 中需引入 `wx-server-sdk` 最新版（>=2.x 支持 openapi）。

---

## 四、完整数据流

```
用户操作                    前端                     云函数/数据库
─────────────────────────────────────────────────────────────────
开启"下次提醒"   →  wx.requestSubscribeMessage()
                    用户点"允许"              →  授权状态存 localStorage

保存记录         →  recordManage.addRecord()  →  records 集合
                                               { enableRemind:true, nextDate, _openid }

每天 8:00        →  (定时触发)                →  sendReminder 云函数
                                               查询 nextDate=今天 的记录
                                               ↓
                                               subscribeMessage.send()
                                               ↓
                                               微信服务器 → 用户手机通知
                                               ↓
                                               records.enableRemind = false
```

---

## 五、边界条件与异常处理

| 场景 | 处理方式 |
|------|---------|
| 用户拒绝订阅授权 | 不强制，仅展示 UI 提醒；可在保存时 toast 提示"未开启通知，请在下次打开小程序时授权" |
| 一次性订阅限制 | 每次开启提醒时需重新授权；可在编辑记录页面再次请求授权 |
| 发送失败（用户注销/换号） | catch 捕获错误，记录日志，不影响其他记录发送 |
| 家庭成员共同宠物 | 只通知记录创建者（`record._openid`）；扩展：可遍历 familyMembers 批量发送 |
| 重复发送 | 发送成功后立即将 `enableRemind` 置 false |
| nextDate 当天修改记录 | 更新记录时若 enableRemind=true 且修改了 nextDate，需重新请求订阅授权 |
| 宠物名称获取 | `sendReminder` 云函数需额外查询 `pets` 集合获取 `petName`，或在 record 中冗余存储 `petName` |

---

## 六、受影响文件

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `miniprogram/utils/constants.js` | 修改 | 新增 `NOTIFY_TEMPLATE_ID` 常量 |
| `miniprogram/pages/record/record-add/record-add.js` | 修改 | `onRemindChange` 中加入 `wx.requestSubscribeMessage` 调用 |
| `cloudfunctions/recordManage/index.js` | 修改 | `addRecord`/`updateRecord` 冗余存储 `petName` 字段 |
| `cloudfunctions/sendReminder/index.js` | 新建 | 定时发送订阅消息的云函数 |
| `cloudfunctions/sendReminder/config.json` | 新建 | 定时触发器配置（每天 8:00） |
| `cloudfunctions/sendReminder/package.json` | 新建 | 依赖 `wx-server-sdk` |

---

## 七、预期效果

1. 用户创建带提醒的记录时，弹出微信订阅消息授权弹窗
2. 用户同意后，在 `nextDate` 当天早上 8:00 收到微信服务通知
3. 点击通知可跳转到对应宠物的记录列表页
4. 发送后自动关闭提醒，防止重复打扰
