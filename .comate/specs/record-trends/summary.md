# 记录趋势页面 - 实施总结

## 完成情况
所有 12 个任务已全部完成，新增 4 个文件，修改 4 个文件。

## 文件清单

### 新增
- `miniprogram/pages/record/record-trends/record-trends.json`
- `miniprogram/pages/record/record-trends/record-trends.wxml`
- `miniprogram/pages/record/record-trends/record-trends.wxss`
- `miniprogram/pages/record/record-trends/record-trends.js`

### 修改
- `miniprogram/app.json` - 注册新页面路径
- `miniprogram/pages/record/record.wxml` - 健康时间线右侧增加「趋势 ›」入口
- `miniprogram/pages/record/record.wxss` - section-title-row 改 flex；新增 .trends-entry 胶囊样式
- `miniprogram/pages/record/record.js` - 新增 `goTrends()` 方法
- `cloudfunctions/recordManage/index.js` - `listRecords` 支持 `startDate / endDate` 范围筛选；`limit` 上限提升到 1000

## 关键实现

### 入口
在 `健康时间线` 标题行右侧加入 `.trends-entry` 胶囊按钮，点击跳转 `/pages/record/record-trends/record-trends`。无当前宠物时提示 "请先添加宠物"。

### 趋势页结构
1. 顶部宠物英雄卡片（粉色渐变 + AGE / WEIGHT / CONDITION 三胶囊）
2. 时间区间 tab：`7d / 30d / 90d / 自定义`，激活态黑底白字
3. 体重折线图卡片
4. 食水量双 Y 轴双折线图卡片（食物 g 左轴绿色，饮水 ml 右轴蓝色）
5. 尿便矩阵热力图（绿/粉双色阶按主导状态）
6. 美容日记矩阵热力图（紫色阶 #F3E5F5→#9C27B0）

### 图表绘制
- 全部使用原生 `<canvas type="2d">` 新接口
- `getCanvasCtx()` 通过 `wx.createSelectorQuery().fields({node:true,size:true})` 拿到 canvas 节点，按 dpr 缩放避免高分屏模糊
- `_drawHeat()` 通用热力图函数：自动按 (cols × 7) 计算单元尺寸，圆角方格，月份分隔标签，星期标签 S/M/T/W/T/F/S，今日描边高亮
- 折线图自适应 Y 轴范围（min == max 时 ±0.1）

### 数据流
- `onShow → loadPetInfo + loadData`
- `loadData` 计算 startDate/endDate，调用 `recordManage list` 一次性拉取窗口内所有记录（type=all, limit=1000）
- 客户端按 `type` 分流 + 按日期聚合
- 通过 `_ready / _pendingDraw` 协调 onReady 与首次 setData 的时序

### 边界处理
- 当前宠物不存在：跳转拦截
- 任一图表无数据：单卡片显示 "暂无数据" 占位
- 体重单位 kg/g 自动归一
- 自定义日期通过 `wx.showActionSheet + wx.showModal(editable:true)` 输入起止日期，两端齐备时才触发加载
- 云函数对老调用方完全兼容（startDate/endDate 可选）

## 后续可扩展点
1. 自定义日期目前用 showModal 输入，可改造为 `<picker mode="date">` 双弹层，体验更好
2. 顶部头像未渲染（cloud 图片地址可能需要 `wx.cloud.getTempFileURL`），仅文字版宠物卡片，后续可补图
3. 食水量目前只按"日"聚合，可拓展为按周/月聚合视图
4. 热力图当前点击不响应，可补充 tooltip / 详情弹层
5. 云函数 `recordManage` 修改后需在小程序开发者工具中重新上传部署生效
