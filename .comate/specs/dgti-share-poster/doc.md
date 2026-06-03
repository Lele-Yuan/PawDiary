# DGTI 分享海报生成功能

## 需求场景
用户在 DGTI 结果页点击「生成分享海报」按钮后，弹出自定义模态框让用户输入自家狗狗的名字，确认后在页面内用 Canvas 2D 绘制一张分享海报，生成图片后可保存到手机相册。

## 技术方案
在 result 页面内实现，不新建页面。使用 Canvas 2D API 绘制海报，通过 `wx.canvasToTempFilePath` 导出图片，`wx.saveImageToPhotosAlbum` 保存到相册。

## 海报内容布局（竖版 750×1334 逻辑像素）

海报自上而下：
1. **顶部背景区** - 渐变色（使用 `personality.iconBg` → `#FFF1ED`），高度约占 40%
2. **狗格类型名称** - 大号字体，居中，如「齐天疯狗型」
3. **狗狗名字** - 用户输入，如「旺财的狗格是」，中等字体
4. **性格标签语** - tagline 引号包裹，斜体风格
5. **稀有度徽章** - SSR/SR/R + 灵魂等级
6. **5维雷达小图** - 居中小型雷达图，复用现有雷达绘制逻辑
7. **底部信息区** - DGTI 品牌标识 + 二维码 +「扫码来测你家狗」文案
8. **PawDiary 品牌水印** - 底部居中小字

## 交互流程
1. 用户点击「生成分享海报」→ 弹出自定义模态框
2. 模态框包含：标题「给狗狗取个名字」、输入框、确认/取消按钮
3. 用户输入狗狗名字后点击确认 → 模态框显示 loading 状态
4. Canvas 绘制海报 → 导出临时图片
5. 导出成功 → 显示海报预览 + 「保存到相册」按钮
6. 点击保存 → 调用 `wx.saveImageToPhotosAlbum`
7. 保存成功 → toast 提示 + 关闭模态框

## 受影响文件

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `miniprogram/pages/dogti/result/result.wxml` | 修改 | 添加海报模态框、隐藏 canvas |
| `miniprogram/pages/dogti/result/result.wxss` | 修改 | 添加模态框、海报预览样式 |
| `miniprogram/pages/dogti/result/result.js` | 修改 | 添加 onShare 方法重构、海报绘制逻辑、保存逻辑 |

## 实现细节

### 模态框结构 (result.wxml)
```
<view class="poster-modal" wx:if="{{showPosterModal}}">
  <!-- 遮罩 -->
  <view class="poster-mask" bindtap="closePosterModal"></view>
  <!-- 模态框内容 -->
  <view class="poster-dialog">
    <!-- 输入态 / 预览态 / loading态 切换 -->
    <view wx:if="{{posterStep === 'input'}}"> ... 输入框 ... </view>
    <view wx:if="{{posterStep === 'loading'}}"> ... loading ... </view>
    <view wx:if="{{posterStep === 'preview'}}"> ... 预览图 + 保存按钮 ... </view>
  </view>
</view>
<!-- 隐藏的离屏 Canvas -->
<view style="position:fixed;left:-9999px;top:-9999px;">
  <canvas type="2d" id="poster-canvas" style="width:750px;height:1334px;"></canvas>
</view>
```

### 海报绘制逻辑 (result.js)
- `showPosterModal` → `posterStep: 'input'`
- `confirmDogName()` → 校验非空 → `posterStep: 'loading'` → 调用 `_drawPoster(dogName)`
- `_drawPoster(dogName)`:
  - 获取 `#poster-canvas`，设置 dpr 缩放
  - 绘制渐变背景
  - 绘制狗格名称（大号粗体）
  - 绘制狗狗名字行
  - 绘制 tagline
  - 绘制稀有度 + 灵魂等级
  - 绘制小型雷达图（复用 _drawMiniRadar 辅助函数）
  - 绘制底部品牌信息
  - `wx.canvasToTempFilePath` 导出
- 导出成功 → `posterStep: 'preview'`，`posterImagePath: tempFilePath`
- `savePoster()` → `wx.saveImageToPhotosAlbum({ filePath: posterImagePath })`

### 边界条件
- 用户不输入名字直接点确认 → 提示「请输入狗狗的名字」
- 保存相册权限被拒绝 → 提示用户在设置中开启
- Canvas 导出失败 → toast 提示「海报生成失败，请重试」
- 图片加载（如果有 iconImg）→ 使用 `wx.getImageInfo` 异步加载后再绘制
