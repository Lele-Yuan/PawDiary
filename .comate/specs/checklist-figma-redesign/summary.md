# 清单页面 Figma 视觉重设计 — 完成总结

## 变更文件

| 文件 | 变更内容 |
|------|---------|
| `miniprogram/pages/checklist/checklist.wxml` | 新增 categories 标题行，卡片改为横向滚动彩色竖向布局 |
| `miniprogram/pages/checklist/checklist.wxss` | 完全重写：大圆角彩色卡片（米黄/薄荷绿）、横向滚动容器 |
| `miniprogram/pages/checklist/checklist-detail/checklist-detail.wxml` | 主内容包入大白卡，标题区加进度%，items 改 pill，add 改虚线 pill，新增 FAB |
| `miniprogram/pages/checklist/checklist-detail/checklist-detail.wxss` | 完全重写：96rpx 大圆角 + 右上角渐变 + 珊瑚阴影，item pill + 圆角方形 checkbox，FAB |

## 核心视觉改进

1. **大圆角**：
   - 清单列表卡片：`border-radius: 64rpx`
   - 详情主卡片：`border-radius: 96rpx`
   - 清单项 pill：`border-radius: 64rpx`

2. **白色卡片右上角渐变**：
   ```css
   background: linear-gradient(135deg, #FFFFFF 65%, rgba(232, 135, 90, 0.07) 100%);
   ```
   应用于详情主卡片和未勾选清单项

3. **清单列表页**：
   - 奇偶交替米黄（`#F5E6CC`）/ 薄荷绿（`#BEE3E7`）彩色卡片
   - 横向 scroll-view 展示，圆形图标底座

4. **清单详情页**：
   - 珊瑚色调阴影：`box-shadow: 0 40rpx 80rpx rgba(149, 73, 49, 0.06)`
   - 勾选框从圆形改为圆角方形（12rpx），已勾选填充深绿 `#3C6663`
   - 已勾选项：灰背景 + 0.6 透明度 + 删除线
   - 未勾选项：白底渐变 + 浅绿边框
   - 虚线 pill "添加新项目" 输入区
   - 珊瑚色 FAB 按钮（`#FE9D7F`）固定右下角
