# DGTI 狗格测试 - 任务计划

- [x] Task 1: 数据层 —— 创建 dgti-data.js
    - 1.1: 创建目录 `miniprogram/pages/dogti/data/`
    - 1.2: 定义 15 个维度常量（E/I/A、F/S/M、C/G/D、P/Z/T、R/B/H）
    - 1.3: 定义 16 个狗格人格数据（名称、代号、标语、稀有度、特征、职业、适配犬种）
    - 1.4: 定义 24 道题目（问题、4 个选项及各维度得分权重）
    - 1.5: 实现 `calcPersonality(scores)` 算分匹配函数

- [x] Task 2: 注册路由 —— 修改 app.json
    - 2.1: 在 `pages` 数组中新增 `pages/dogti/index/index`、`pages/dogti/test/test`、`pages/dogti/result/result`

- [x] Task 3: 改造入口 —— profile 页面
    - 3.1: 在 `profile.wxml` DGTI 按钮 `<view>` 上添加 `bindtap="goDgti"`
    - 3.2: 在 `profile.js` 中新增 `goDgti()` 跳转方法

- [x] Task 4: DGTI 首页 —— pages/dogti/index
    - 4.1: 创建 `index.json`，配置 navigationStyle: custom
    - 4.2: 创建 `index.wxml`，实现 Hero 区域（标题、副标题、主视觉扫描卡片、CTA 按钮）
    - 4.3: 创建 `index.wxml`，实现"发现稀有狗格"横向滚动卡片列表
    - 4.4: 创建 `index.js`，绑定狗格数据、跳转答题页、查看全部逻辑
    - 4.5: 创建 `index.wxss`，还原设计稿视觉（暖棕色系、圆角、阴影、扫描线动效）

- [x] Task 5: 答题页 —— pages/dogti/test
    - 5.1: 创建 `test.json`，配置 navigationStyle: custom
    - 5.2: 创建 `test.wxml`，实现顶部导航栏（DGTI logo + 返回）
    - 5.3: 创建 `test.wxml`，实现进度条区域（PROGRESS 标签 + 计数 + 进度条）
    - 5.4: 创建 `test.wxml`，实现题目卡片（情境图 + 问题文本 + 4 个选项 + 底部语录）
    - 5.5: 创建 `test.js`，实现答题状态管理（当前题号、已选答案、维度得分累积）
    - 5.6: 创建 `test.js`，实现选项选中后自动进入下一题（300ms 延迟动效）、答完后跳转结果页
    - 5.7: 创建 `test.wxss`，还原设计稿视觉（卡片阴影、选项选中状态、进度条样式）

- [x] Task 6: 结果页 —— pages/dogti/result
    - 6.1: 创建 `result.json`，配置 navigationStyle: custom
    - 6.2: 创建 `result.wxml`，实现主图区域（大背景图 + RESULT UNLOCKED badge + 狗格名 + 标语）
    - 6.3: 创建 `result.wxml`，实现属性卡片行（DOG JOB TITLE + SOUL RANK）
    - 6.4: 创建 `result.wxml`，实现 Soul DNA Breakdown（3 条进度条）
    - 6.5: 创建 `result.wxml`，实现 Trait Manifestation（特性分析 2 条）
    - 6.6: 创建 `result.wxml`，实现底部操作按钮（分享 + 查看图鉴）
    - 6.7: 创建 `result.js`，接收路由参数、解析结果 ID、渲染对应狗格数据
    - 6.8: 创建 `result.js`，实现分享功能（`onShareAppMessage`）
    - 6.9: 创建 `result.wxss`，还原设计稿视觉（渐变遮罩、进度条、卡片布局）
