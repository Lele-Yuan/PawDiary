# 来我家吃饭（mealtime）对齐整体视觉任务计划

- [x] Task 1: 重写主题 mealtime-theme.wxss 为紫色品牌（核心）
    - 1.1: page{} 变量对齐全局（主色/背景/文字/边框/渐变）
    - 1.2: 公共类投影改紫色 rgba(123,92,245,*)
    - 1.3: .tag.cook/.eat/.admin、.avatar、.chip 改用紫色软底/软标签色

- [x] Task 2: 各页面 wxss 残留硬编码值等价紫色替换
    - 2.1: #FBF1EC→#F8F5FF、#FDECE8→#EFEAFE、#FFFBF4→#F6F3FF
    - 2.2: rgba(228,120,108,*)→rgba(123,92,245,*)
    - 2.3: 暖灰虚线/文本改紫灰，family 的 danger-btn 改全局危险色

- [x] Task 3: 8 个页面接入自定义 nav-bar
    - 3.1: 各 json 改 navigationStyle custom + 引入 nav-bar 组件
    - 3.2: 各 wxml 顶部插入 <nav-bar title back titleOpacity>
    - 3.3: 各 js 增 navTitleOpacity 与 onPageScroll
    - 3.4: family 的 nav 标题绑定饭局名（title="{{detail.family.name}}"）

- [x] Task 4: 自测
    - 4.1: node --check 全部页面 js
    - 4.2: 校验 json 合法、含 navigationStyle custom 与 nav-bar
    - 4.3: 确认无残留珊瑚/暖色硬编码值
