# DGTI 分享海报生成 - 实现总结

## 完成情况
全部 3 个任务已完成，功能实现在 result 页面内，无需新建页面。

## 修改文件

### `miniprogram/pages/dogti/result/result.wxml`
- 添加海报模态框（3态切换：输入态、loading 态、预览态）
- 添加离屏 Canvas（750×1334 逻辑像素）用于海报绘制

### `miniprogram/pages/dogti/result/result.wxss`
- 模态框遮罩层（半透明深色背景）
- 弹窗容器（圆角、阴影）
- 输入态：标题、输入框（暖色背景）、确认/取消按钮
- loading 态：旋转动画
- 预览态：海报图片预览 + 保存按钮

### `miniprogram/pages/dogti/result/result.js`
- 重构 `onShare()` → 弹出模态框（posterStep: 'input'）
- 新增 `onDogNameInput()` / `closePosterModal()` / `confirmDogName()`
- 新增 `_drawPoster()` → 获取离屏 Canvas，调用 `_renderPoster()` 绘制后导出
- 新增 `_renderPoster()` → 渐变背景、装饰圆、DGTI 品牌、狗格名称、狗狗名字、tagline、稀有度+灵魂等级徽章、白色卡片+小型雷达图、底部二维码占位+品牌水印
- 新增 `_drawMiniRadar()` → 3层网格+数据多边形+中文标签+百分比
- 新增 `savePoster()` → `wx.saveImageToPhotosAlbum` + 权限拒绝引导
- 新增 `_posterFail()` → 失败回退到输入态
- 新增 `roundRect()` 辅助函数

## 交互流程
1. 点击「生成分享海报」→ 弹出自定义模态框
2. 输入狗狗名字 → 点击「生成海报」→ loading 动画
3. Canvas 绘制完成 → 显示海报预览
4. 点击「保存到相册」→ 调用相册 API → 成功后关闭弹窗
5. 权限被拒 → 引导用户去设置开启
