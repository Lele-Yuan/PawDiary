# 记录页面增加提醒开关与倒计时进度条

## 需求场景

在添加记录时，用户可以开启"下次提醒"开关。开启后可设置提醒间隔天数，系统自动计算下次提醒日期。在记录列表中，有提醒的记录显示提醒标识和从上次记录到提醒日期的倒计时进度条。

## 技术方案

### 数据模型扩展

records 集合新增字段：
- `enableRemind`: Boolean - 是否开启提醒
- `remindInterval`: Number - 提醒间隔天数（如 30、60、90）

`nextDate` 字段已存在，开启提醒后自动计算：`nextDate = date + remindInterval 天`

### 添加记录页（record-add）

在"下次预计日期"表单项下方新增：

1. **提醒开关**：`<switch>` 组件，label "下次提醒"
2. **间隔选择**：开关打开后显示，提供常用间隔快捷选择（30天/60天/90天/自定义）
3. 选择间隔后自动计算 `nextDate = form.date + interval`，同步更新"下次预计日期"显示

### 记录列表页（record）

对启用了提醒的记录（`enableRemind && nextDate`）：

1. **提醒标识**：在卡片标题右侧显示 🔔 图标
2. **倒计时进度条**：在卡片副标题下方显示
   - 总天数 = nextDate - date
   - 已过天数 = today - date
   - 进度 = 已过天数 / 总天数（0~100%）
   - 超期（>100%）时进度条变红，显示"已超期 X 天"
   - 未超期时显示"还剩 X 天"

进度条颜色逻辑：
- 0~60%：绿色 `#249654`
- 60~90%：橙色 `#F5A623`
- 90~100%：红色 `#C0392B`
- 超期：红色 `#C0392B`

### 影响文件

| 文件 | 修改类型 | 说明 |
|---|---|---|
| `miniprogram/pages/record/record-add/record-add.wxml` | 修改 | 新增提醒开关和间隔选择 UI |
| `miniprogram/pages/record/record-add/record-add.wxss` | 修改 | 新增开关、间隔选择器样式 |
| `miniprogram/pages/record/record-add/record-add.js` | 修改 | 新增开关切换、间隔选择逻辑，自动计算 nextDate |
| `miniprogram/pages/record/record.wxml` | 修改 | 卡片中增加提醒标识和进度条 |
| `miniprogram/pages/record/record.wxss` | 修改 | 新增进度条和提醒标识样式 |
| `miniprogram/pages/record/record.js` | 修改 | loadRecords 中计算进度百分比和剩余天数 |

### 实现细节

#### record-add.wxml 新增部分

在"下次预计日期" picker 下方插入：
```xml
<!-- 提醒开关 -->
<view class="form-group remind-group">
  <view class="form-label">下次提醒</view>
  <switch checked="{{form.enableRemind}}" bindchange="onRemindChange" color="#6B2D1A" />
</view>

<!-- 间隔选择（仅提醒开启时显示） -->
<view class="interval-section" wx:if="{{form.enableRemind}}">
  <view class="form-label">提醒间隔</view>
  <view class="interval-tags">
    <view class="interval-tag {{form.remindInterval === 30 ? 'active' : ''}}"
      data-days="30" bindtap="onSelectInterval">30天</view>
    <view class="interval-tag {{form.remindInterval === 60 ? 'active' : ''}}"
      data-days="60" bindtap="onSelectInterval">60天</view>
    <view class="interval-tag {{form.remindInterval === 90 ? 'active' : ''}}"
      data-days="90" bindtap="onSelectInterval">90天</view>
    <view class="interval-tag {{form.remindInterval === 180 ? 'active' : ''}}"
      data-days="180" bindtap="onSelectInterval">180天</view>
  </view>
  <view class="interval-custom">
    <input type="number" placeholder="自定义天数"
      value="{{customInterval}}" bindinput="onCustomInterval" />
    <text class="interval-unit">天</text>
  </view>
  <view class="next-date-preview" wx:if="{{form.nextDate}}">
    下次提醒：{{form.nextDate}}
  </view>
</view>
```

#### record-add.js 新增方法

```js
// form 中新增字段
form: {
  ...existing,
  enableRemind: false,
  remindInterval: 0
}

onRemindChange(e) {
  this.setData({ 'form.enableRemind': e.detail.value });
  if (!e.detail.value) {
    this.setData({ 'form.nextDate': '', 'form.remindInterval': 0 });
  }
},

onSelectInterval(e) {
  var days = Number(e.currentTarget.dataset.days);
  this.setData({ 'form.remindInterval': days, customInterval: '' });
  this.calcNextDate(days);
},

onCustomInterval(e) {
  var days = Number(e.detail.value);
  if (days > 0) {
    this.setData({ 'form.remindInterval': days, customInterval: e.detail.value });
    this.calcNextDate(days);
  }
},

calcNextDate(days) {
  if (!this.data.form.date || !days) return;
  var base = new Date(this.data.form.date);
  base.setDate(base.getDate() + days);
  var y = base.getFullYear();
  var m = String(base.getMonth() + 1).padStart(2, '0');
  var d = String(base.getDate()).padStart(2, '0');
  this.setData({ 'form.nextDate': y + '-' + m + '-' + d });
}
```

提交时数据库新增存储 `enableRemind` 和 `remindInterval`。

#### record.js loadRecords 中计算进度

```js
// 对每条记录计算提醒进度
var now = new Date();
var nowTime = now.getTime();

records = data.map(function(r) {
  var item = { /* ...existing mapping... */ };

  // 提醒进度计算
  if (r.enableRemind && r.nextDate && r.date) {
    var dateTime = new Date(r.date).getTime();
    var nextTime = new Date(r.nextDate).getTime();
    var totalMs = nextTime - dateTime;
    var elapsedMs = nowTime - dateTime;

    if (totalMs > 0) {
      var progress = Math.min(Math.round(elapsedMs / totalMs * 100), 100);
      var remainDays = Math.ceil((nextTime - nowTime) / 86400000);
      item.remindProgress = Math.max(0, progress);
      item.remindOverdue = remainDays < 0;
      item.remindDaysText = remainDays >= 0 ? '还剩 ' + remainDays + ' 天' : '已超期 ' + Math.abs(remainDays) + ' 天';
      item.remindProgressColor = progress >= 90 ? '#C0392B' : (progress >= 60 ? '#F5A623' : '#249654');
      if (remainDays < 0) {
        item.remindProgress = 100;
        item.remindProgressColor = '#C0392B';
      }
    }
  }
  item.hasRemind = !!r.enableRemind;
  return item;
});
```

#### record.wxml 卡片中新增

```xml
<!-- 提醒标识（标题行） -->
<view class="remind-icon" wx:if="{{item.hasRemind}}">🔔</view>

<!-- 倒计时进度条（在 card-subtitle 之后） -->
<view class="remind-bar-wrap" wx:if="{{item.hasRemind && item.remindProgress !== undefined}}">
  <view class="remind-bar-bg">
    <view class="remind-bar-fill"
      style="width: {{item.remindProgress}}%; background-color: {{item.remindProgressColor}};"></view>
  </view>
  <text class="remind-days-text" style="color: {{item.remindProgressColor}};">
    {{item.remindDaysText}}
  </text>
</view>
```

## 边界条件

- 未填写记录日期时，选择间隔不计算 nextDate（等日期填写后再计算）
- 修改记录日期后，如果已开启提醒，需要重新计算 nextDate
- 间隔为 0 或负数时忽略
- 超期记录进度条固定 100% 并变红
- 未开启提醒的记录不显示进度条和标识
- 使用 ES5 语法避免 Babel runtime 问题
