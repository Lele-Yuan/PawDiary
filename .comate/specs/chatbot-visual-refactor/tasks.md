# ChatBot 视觉重构任务计划

- [x] Task 1: 重构 agent-ui 容器与导航栏视觉
    - 1.1: `.agent-ui` 容器背景改为 `var(--bg-color)`，文字色改为 `var(--text-color)`
    - 1.2: `.navBar` 阴影统一为 `var(--shadow-card)`
    - 1.3: `.bot-name` 字色 `var(--text-color)`，字号改 rpx
    - 1.4: 顶部图标/操作按钮的 hover/active 态色调改为紫色系

- [x] Task 2: 重构消息气泡样式
    - 2.1: 用户消息 `.user_content` 改为 `var(--primary-color)` 底 + 白字 + `var(--radius-md)` 圆角
    - 2.2: 系统消息 `.system` 改为 `var(--card-bg)` 半透明卡片 + `var(--shadow-card)` + `var(--radius-md)`
    - 2.3: markdown 在用户气泡中的对比度修正（链接、code、加粗）
    - 2.4: 时间戳 / 角色名等次级文字使用 `var(--text-secondary)` `var(--text-light)`

- [x] Task 3: 重构输入区与快捷问题
    - 3.1: `.input_inner_box` 背景 `var(--card-soft-bg)`，边框 `1rpx solid var(--primary-bg)`，圆角 `var(--radius-md)`
    - 3.2: `.input` 文字色 `var(--text-color)`，字号 `28rpx`
    - 3.3: 发送按钮改为 `var(--primary-color)` 主紫，白字，`var(--shadow-button)`
    - 3.4: `.question_content` 快捷问题改为 `var(--primary-bg)` 底，`var(--primary-dark)` 字，`var(--radius-md)`

- [x] Task 4: 重构功能面板与设置面板
    - 4.1: `.function` 背景 `var(--card-soft-bg)`，圆角 `var(--radius-md)`，字色 `var(--text-color)`
    - 4.2: `.set_panel` 背景 `var(--card-soft-bg)`，分隔线 `var(--primary-bg)`
    - 4.3: 面板内图标按钮 active 态使用紫色系

- [x] Task 5: 重构抽屉（会话历史）
    - 5.1: `.drawer` 背景改为 `var(--bg-color)`
    - 5.2: `.create-new-chat` 改为 `var(--primary-color)` 底白字 + `var(--shadow-button)`
    - 5.3: 历史会话列表项 hover/选中态使用 `var(--primary-bg)`，文字 `var(--text-color)` / `var(--primary-dark)`
    - 5.4: 抽屉顶部标题与关闭按钮配色统一

- [x] Task 6: 重构底部 action-menu
    - 6.1: `.action-menu` 圆角 `var(--radius-lg)`，阴影 `var(--shadow-floating)`
    - 6.2: `.action-item` 分隔线改为 `var(--primary-bg)`，字色 `var(--text-color)`
    - 6.3: 危险操作（删除）字色保留 `var(--danger-color)`

- [x] Task 7: 单位与字体规范化
    - 7.1: 将 agent-ui index.wxss 中的 `px` 字号统一改为 `rpx`（保留 `1px`/`1rpx` 边框）
    - 7.2: 字体栈对齐 app.wxss 全局规范
    - 7.3: 检查并修正硬编码 hex 色值，全部替换为 CSS 变量

- [x] Task 8: 页面级样式与回归验证
    - 8.1: 在 `pages/chatBot/chatBot.wxss` 中补充必要的页面级覆盖（如背景、滚动容器）
    - 8.2: 真机/开发者工具自查：消息发送、语音、上传、抽屉、快捷问题、设置面板的视觉与交互
    - 8.3: 与首页/记录页对比，确认视觉一致性
