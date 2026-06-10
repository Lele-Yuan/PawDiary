# ChatBot 视觉重构（chatbot-visual-refactor）

## 1. 需求场景与背景

PawDiary 小程序近期完成了一次"视觉重构"（commit 5c2c880），全局采用了**紫色品牌主题** + **半透明卡片** + **大圆角** + **紫色软阴影**的现代设计语言。但 `chatBot` 页面所使用的 `agent-ui` 组件仍保持原有的**黑白灰 + 蓝紫消息气泡**风格，与全局视觉严重脱节，存在明显的设计债务。

本次任务：**以全局视觉风格为基准，重构 chatBot 相关样式，使其融入 PawDiary 的紫色设计体系。**

不改动业务逻辑、组件结构、交互方式，仅调整视觉层（颜色、圆角、阴影、间距、字体单位）。

## 2. 设计基线（来自 app.wxss）

### 2.1 颜色 Token
- `--primary-color: #7B5CF5`（主紫）
- `--primary-dark: #5A3FE0`
- `--primary-light: #A48BFA`
- `--primary-bg: #EFEAFE`（紫色背景，可作消息气泡）
- `--bg-color: #F6F3FF`（页面背景）
- `--card-bg: #FFFFFF80`（半透明白卡片）
- `--card-soft-bg: #F8F5FF`（软卡片 / 输入框）
- `--text-color: #1F1A3D`
- `--text-secondary: #6B6585`
- `--text-light: #B5B0C8`

### 2.2 圆角
- `--radius-sm: 16rpx`
- `--radius-md: 24rpx`
- `--radius-lg: 32rpx`
- `--radius-xl: 40rpx`
- `--radius-pill: 999rpx`

### 2.3 阴影
- `--shadow-card: 0 8rpx 24rpx rgba(123, 92, 245, 0.08)`
- `--shadow-button: 0 8rpx 20rpx rgba(123, 92, 245, 0.32)`
- `--shadow-floating: 0 16rpx 40rpx rgba(60, 40, 130, 0.16)`

## 3. 技术方案

### 3.1 修改范围
- **主文件**：`/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/components/agent-ui/index.wxss`（731 行，agent-ui 主样式）
- **辅助文件**：`/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/chatBot/chatBot.wxss`（当前为空，必要时补充页面级样式）

不修改：
- 子组件内部 wxss（chatFile、collapse、customCard、feedback、tool、wd-markdown）—— 若发现明显跳脱再单独处理
- 任何 wxml / js / json
- 全局 app.wxss

### 3.2 视觉映射规则

| 区域 | 当前 | 重构后 |
|---|---|---|
| `.agent-ui` 容器背景 | `#fff` | `var(--bg-color)` `#F6F3FF` |
| `.navBar` 阴影 | `0 16px 16px #fff` | `var(--shadow-card)` |
| `.bot-name` 文字色 | `#333` | `var(--text-color)` `#1F1A3D` |
| 用户消息气泡 `.user_content` | `#f3f5fb` | `var(--primary-color)` `#7B5CF5`，文字白色 |
| 系统消息 `.system` 圆角 | `12rpx` | `var(--radius-md)` `24rpx`；背景 `var(--card-bg)`；阴影 `var(--shadow-card)` |
| 输入框 `.input_inner_box` | `#f3f4f6` + `1px #f3f3f3` + `16px` | `var(--card-soft-bg)` + `1rpx solid var(--primary-bg)` + `var(--radius-md)` |
| 输入文字 `.input` | `black 16px` | `var(--text-color) 28rpx` |
| 快捷问题 `.question_content` | `#f5f5f5 / 12px` | `var(--primary-bg)` + `var(--radius-md)`，字色 `var(--primary-dark)` |
| 功能按钮 `.function` | `#f3f4f6 / 16px / black` | `var(--card-soft-bg)` + `var(--radius-md)`，字色 `var(--text-color)` |
| 设置面板 `.set_panel` | `#f3f3f3` | `var(--card-soft-bg)` |
| 抽屉 `.drawer` | `#f9fbff` | `var(--bg-color)` |
| 新建会话按钮 `.create-new-chat` | 蓝色系 `#dee9fc / #4d6bfe` | `var(--primary-color)` 底，白字，`var(--shadow-button)` |
| 底部 `.action-menu` | `#fff` + 黑色阴影 | `#fff` + `var(--shadow-floating)`，圆角 `var(--radius-lg)` |
| `.action-item` 分隔线 | `#f0f0f0` | `var(--primary-bg)` |
| 主操作按钮（发送等） | 默认/灰 | `var(--primary-color)` 渐变或纯色，白字 + `var(--shadow-button)` |

### 3.3 单位规范
- 组件内的 `px` 单位统一替换为 `rpx`（除 `1px` 边框和必要硬件像素场景）
- 字体大小：
  - 主文字 `28rpx`
  - 标题 / bot 名 `32rpx ~ 36rpx`，weight `500`
  - 辅助文字 `24rpx`，色 `var(--text-secondary)`

### 3.4 边界与异常
- agent-ui 第三方组件包含大量子选择器，重构以"颜色/圆角/阴影/字体"为主，**不调整布局尺寸**（min-height、flex、padding 框架值保留）以防破坏交互
- `.user_content` 改为深紫底白字时，需确保 markdown 渲染内的链接、code 块对比度（必要时为 `.user_content .markdown a` 单独提色）
- 抽屉、action-menu 在不同主题下定位（fixed）保持不变
- 单位替换时小心 `border` 的 `1px`：保留 `1rpx` 或 `1px`，按视觉清晰度选择

### 3.5 数据流
仅样式层改动，无数据流变更。

## 4. 预期成果
- 打开 chatBot 页面背景为 `#F6F3FF`，与 tabBar、其他 tab 页面无缝衔接
- 用户消息为紫色气泡白字，系统消息为半透明白卡片+紫色软阴影
- 输入框、快捷问题、功能按钮、抽屉、底部操作菜单全部使用紫色体系 token
- 视觉与"宠物管家"主题一致，不再出现蓝色/灰色突兀色块
- 不影响 agent-ui 现有功能（语音、上传、会话切换、markdown 渲染等）

## 5. 受影响文件清单

| 路径 | 类型 |
|---|---|
| `/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/components/agent-ui/index.wxss` | 修改（核心） |
| `/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/chatBot/chatBot.wxss` | 视情况新增页面级覆盖样式 |
