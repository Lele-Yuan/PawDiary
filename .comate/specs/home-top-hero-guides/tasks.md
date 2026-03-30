# 首页顶部通顶改版与指南模块任务清单
- [x] Task 1: 改造首页顶部为通顶 Hero 结构
    - 1.1: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/home.json`，为首页开启 `navigationStyle: "custom"`
    - 1.2: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/home.js`，增加 `statusBarHeight` 数据并在生命周期中读取系统安全区高度
    - 1.3: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/home.wxml`，为 `pet-card` 传入 `statusBarHeight`，并给无宠物态补充顶部安全区样式
    - 1.4: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/components/pet-card/pet-card.js`，扩展组件属性以接收顶部安全区高度
    - 1.5: 重写 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/components/pet-card/pet-card.wxml` 的 Hero 结构布局
    - 1.6: 重写 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/components/pet-card/pet-card.wxss`，实现通顶渐变背景、头像排布、统计块和底部圆角

- [x] Task 2: 调整首页快捷入口为圆形图标样式
    - 2.1: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/home.wxml` 中快捷入口结构，改为单行四项入口
    - 2.2: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/home.wxss` 中快捷入口样式，重建圆形图标容器、标签和卡片间距
    - 2.3: 保持 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/home.js` 中现有快捷入口跳转方法不变，并验证结构改动后绑定关系仍正确

- [x] Task 3: 新增养猫指南与养狗指南双卡片模块
    - 3.1: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/home.wxml`，在快捷入口和近期提醒之间插入双卡片模块
    - 3.2: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/home.wxss`，实现双列卡片布局、差异化浅色背景和装饰元素样式
    - 3.3: 保持该模块为静态展示，不新增跳转逻辑与页面路由

- [x] Task 4: 回归首页布局并完成收尾
    - 4.1: 复查 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/home.wxml` 与 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/home/home.wxss` 的整体间距，确保 Hero、快捷入口、指南模块、提醒区过渡自然
    - 4.2: 检查无宠物态、已有宠物态两种场景的首屏显示，确认顶部安全区和内容未被遮挡
    - 4.3: 运行与本次改动相关的检查，确认没有明显语法或配置问题
