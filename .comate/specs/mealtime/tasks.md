# 来我家吃饭（mealtime）模块集成任务计划

- [✓] Task 1: 新建 mealManage 云函数（合并原 5 个云函数，集合加 meal_ 前缀）
    - 1.1: 创建 cloudfunctions/mealManage/index.js，实现动作路由、getMe 懒创建 meal_users、myMembership 公共方法
    - 1.2: 迁移 family 逻辑到 family.js（myList/create/detail/join/approve/removeMember/setAdmin/switchRole），集合名改 meal_ 前缀
    - 1.3: 迁移 dish 逻辑到 dish.js（myList/save/remove/poolList/ingredients/tastes），集合名改 meal_ 前缀
    - 1.4: 迁移 meal 逻辑到 meal.js + order.js（current/start/pick/unpick/submit/finish/receipt/history），集合名改 meal_ 前缀
    - 1.5: 新增 syncProfile 动作（同步宿主昵称/头像进 meal_users）与 seedBaseData 动作（初始化食材/口味库）
    - 1.6: 创建 package.json，声明 wx-server-sdk 依赖

- [✓] Task 2: 迁移模块工具与样式到 pages/mealtime/
    - 2.1: 新建 pages/mealtime/utils/util.js（复制原 util.js）
    - 2.2: 新建 pages/mealtime/utils/api.js，改造为统一调用 mealManage 并传命名空间动作，新增 syncProfile 封装
    - 2.3: 新建 pages/mealtime/mealtime-theme.wxss（复制原模块 app.wxss 全局样式）

- [✓] Task 3: 迁移 8 个页面到 pages/mealtime/ 并调整依赖与路径
    - 3.1: 复制 index/family/members/menu/dishEdit/order/receipt/history 到 pages/mealtime/<page>/
    - 3.2: 页面 JS 的 require 由 ../../utils/ 改为 ../utils/
    - 3.3: 页面内 /pages/xxx 跳转统一改为 /pages/mealtime/xxx
    - 3.4: 去除对 app.getUser 的强依赖，改用宿主 getUser；保留 app.globalData.currentFamilyId 赋值
    - 3.5: 各页面 wxss 顶部加 @import "../mealtime-theme.wxss"
    - 3.6: 各页面 json 设置绿色导航栏（navigationBarBackgroundColor/navigationBarTitleText）

- [✓] Task 4: 注册页面并扩展宿主 app
    - 4.1: app.json 的 pages 数组追加 8 个 mealtime 页面
    - 4.2: app.js 新增 getUser() 方法，返回宿主已登录用户

- [✓] Task 5: 「我的」页新增「来吃饭」入口
    - 5.1: profile.wxml 在「记账分账」之后新增 quick-action-item
    - 5.2: profile.js 新增 goMealtime()，navigateTo 约饭首页

- [✓] Task 6: 约饭首页新增「我的菜单」入口（替代原 tabBar）
    - 6.1: pages/mealtime/index/index.wxml 头部新增「我的菜单」入口按钮
    - 6.2: pages/mealtime/index/index.js 新增 goMenu()

- [✓] Task 7: 自测与部署说明
    - 7.1: 开发者工具编译，核对页面注册、跳转路径、样式隔离无报错
    - 7.2: 在 summary.md 输出部署步骤：部署 mealManage 云函数、创建 8 个 meal_ 集合、触发 seedBaseData 初始化基础库
