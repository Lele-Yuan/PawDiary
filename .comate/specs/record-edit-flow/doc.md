# 记录编辑流程与时间线样式优化

## 需求概述

三个子需求：
1. 点击记录列表中的卡片，进入编辑页面，支持修改信息和删除
2. 时间线样式调整：将完成日期放在 timeline-dot 上方，格式为 `YY.MM.DD`（如 26.03.01）
3. "立即完成"按钮逻辑：新增一条当天记录，并继承原记录的提醒设置继续提醒；若已超期则自动结束提醒

## 技术方案

### 1. 复用 record-add 页面作为编辑页

不新建页面，复用 `record-add` 页面，通过 URL 参数 `id` 区分新增/编辑模式：
- 无 `id`：新增模式（现有行为）
- 有 `id`：编辑模式，加载已有数据填充表单，提交时执行 `update` 而非 `add`

**record-add.js onLoad 改造：**
```js
onLoad(options) {
  var today = new Date();
  var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  this.setData({ today: todayStr });

  if (options.id) {
    // 编辑模式
    this.setData({ editId: options.id, pageTitle: '编辑记录' });
    this.loadRecord(options.id);
  } else {
    this.setData({ 'form.date': todayStr, pageTitle: '添加记录' });
  }
},
```

**新增 loadRecord 方法：**
```js
async loadRecord(id) {
  try {
    showLoading('加载中...');
    var db = wx.cloud.database();
    var res = await db.collection('records').doc(id).get();
    var r = res.data;
    var formatD = function(d) {
      if (!d) return '';
      var dt = new Date(d);
      return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
    };
    this.setData({
      form: {
        type: r.type || '',
        date: formatD(r.date),
        title: r.title || '',
        description: r.description || '',
        location: r.location || '',
        cost: r.cost ? String(r.cost) : '',
        nextDate: formatD(r.nextDate),
        enableRemind: !!r.enableRemind,
        remindInterval: r.remindInterval || 0,
        images: r.images || []
      },
      customInterval: r.remindInterval > 0 && [30,60,90,180].indexOf(r.remindInterval) === -1 ? String(r.remindInterval) : ''
    });
    hideLoading();
  } catch (err) {
    console.error('加载记录失败', err);
    hideLoading();
    showError('加载失败');
  }
},
```

**onSubmit 改造（编辑模式用 update）：**
```js
if (this.data.editId) {
  await db.collection('records').doc(this.data.editId).update({
    data: { /* 同 add 的 data 字段，但不含 petId 和 createdAt */ }
  });
} else {
  await db.collection('records').add({ data: { petId, ...fields, createdAt: new Date() } });
}
```

**新增删除方法 onDelete：**
```js
onDelete() {
  var that = this;
  wx.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除吗？',
    confirmColor: '#C0392B',
    success: function(res) {
      if (res.confirm) {
        var db = wx.cloud.database();
        db.collection('records').doc(that.data.editId).remove().then(function() {
          showSuccess('已删除');
          setTimeout(function() { wx.navigateBack(); }, 1500);
        }).catch(function(err) {
          showError('删除失败');
        });
      }
    }
  });
},
```

**record-add.wxml 改造：**
- nav-bar title 使用 `{{pageTitle}}`
- 提交按钮文案改为 `{{editId ? '保存修改' : '保存记录'}}`
- 编辑模式下底部增加删除按钮

```xml
<nav-bar title="{{pageTitle}}" back="{{true}}" />
...
<button ...>{{editId ? '保存修改' : '保存记录'}}</button>
...
<button class="btn-delete" wx:if="{{editId}}" bindtap="onDelete">删除记录</button>
```

### 2. record 列表页：点击卡片进入编辑、时间线日期样式

**record.wxml 改造：**

卡片绑定 `bindtap="goEdit"` 传入 `_id`：
```xml
<view class="timeline-card ..."
  data-id="{{item._id}}"
  bindtap="goEdit"
  bindlongpress="onLongPressRecord">
```

时间线左侧增加日期显示在 dot 上方：
```xml
<view class="timeline-left">
  <text class="timeline-date">{{item.shortDateStr}}</text>
  <view class="timeline-dot" ...></view>
  <view class="timeline-line" ...></view>
</view>
```

`shortDateStr` 格式为 `YY.MM.DD`，如 `26.03.01`。在 record.js 的 map 中计算：
```js
// 将 dateStr "2026-03-01" 转为 "26.03.01"
var ds = formatDate(r.date, 'YYYY-MM-DD');
item.shortDateStr = ds ? ds.substring(2).replace(/-/g, '.') : '';
```

**record.js 新增 goEdit 方法：**
```js
goEdit(e) {
  var id = e.currentTarget.dataset.id;
  wx.navigateTo({ url: '/pages/record/record-add/record-add?id=' + id });
},
```

**CSS 调整：**
```css
.timeline-date {
  font-size: 20rpx;
  color: #999;
  margin-bottom: 8rpx;
  white-space: nowrap;
}
```

同时移除副标题中已完成日期的显示（因为已经在时间线上显示了）。

### 3. "立即完成"逻辑

点击"立即完成"按钮时：
1. 以当天日期新增一条相同类型/标题的记录
2. 如果原记录有提醒设置（enableRemind + remindInterval）：
   - 以当天日期 + remindInterval 计算新的 nextDate
   - 新记录继承 enableRemind 和 remindInterval
3. 如果原记录已超期（remindOverdue），新记录不继续提醒（enableRemind = false）
4. 完成后关闭原记录的提醒（将原记录的 enableRemind 设为 false，清空 nextDate）

**record.js 新增 onComplete 方法：**
```js
async onComplete(e) {
  var id = e.currentTarget.dataset.id;
  var record = null;
  var records = this.data.records;
  for (var i = 0; i < records.length; i++) {
    if (records[i]._id === id) { record = records[i]; break; }
  }
  if (!record) return;

  var app = getApp();
  var petId = app.globalData.currentPetId;
  var db = wx.cloud.database();
  var now = new Date();
  var todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

  // 判断是否继续提醒
  var continueRemind = !!record.enableRemind && record.remindInterval > 0 && !record.remindOverdue;
  var newNextDate = null;
  if (continueRemind) {
    var base = new Date(todayStr);
    base.setDate(base.getDate() + record.remindInterval);
    newNextDate = base;
  }

  try {
    showLoading('完成中...');
    // 新增完成记录
    await db.collection('records').add({
      data: {
        petId: petId,
        type: record.type,
        date: new Date(todayStr),
        title: record.title,
        description: '',
        location: record.location || '',
        cost: 0,
        nextDate: newNextDate,
        enableRemind: continueRemind,
        remindInterval: continueRemind ? record.remindInterval : 0,
        images: [],
        createdAt: new Date()
      }
    });

    // 关闭原记录的提醒
    await db.collection('records').doc(id).update({
      data: {
        enableRemind: false,
        nextDate: null
      }
    });

    hideLoading();
    showSuccess('已完成');
    this.loadRecords();
  } catch (err) {
    console.error('完成记录失败', err);
    hideLoading();
    showError('操作失败');
  }
},
```

## 受影响文件

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `miniprogram/pages/record/record.js` | 修改 | 新增 goEdit、onComplete 方法；loadRecords 增加 shortDateStr 计算 |
| `miniprogram/pages/record/record.wxml` | 修改 | 卡片绑定 tap 跳转编辑；时间线增加日期；"立即完成"绑定 onComplete |
| `miniprogram/pages/record/record.wxss` | 修改 | 时间线日期样式 |
| `miniprogram/pages/record/record-add/record-add.js` | 修改 | 支持编辑模式（loadRecord、update、onDelete） |
| `miniprogram/pages/record/record-add/record-add.wxml` | 修改 | 动态标题、按钮文案、删除按钮 |
| `miniprogram/pages/record/record-add/record-add.wxss` | 修改 | 删除按钮样式 |

## 边界条件
- 编辑模式下图片已是 cloud:// 开头的不重复上传
- nextDate 为 null 时不显示提醒相关 UI
- 已超期记录点击"立即完成"后新记录不继续提醒
- 删除操作需二次确认
