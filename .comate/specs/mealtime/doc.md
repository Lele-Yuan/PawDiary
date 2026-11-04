# 来我家吃饭（mealtime）模块集成设计

## 一、需求概述

将独立小程序「来吃饭」的全部功能集成进 PawDiary 宠物管家小程序，并在「我的」页「常用功能」区的「记账分账」入口之后，新增一个「来吃饭」入口。用户点击后进入约饭首页，可创建/加入家庭、维护个人菜单、发起约饭点菜、管理员下单生成小票、查看历史小票，原模块能力全部保留。

本次集成不改变 PawDiary 现有任何功能，新模块与宿主数据、样式、云函数完全隔离，参照项目中已存在的 `splitpal` 记账分账工具的隔离范式实现。

## 二、源模块分析

源包路径 `~/Downloads/来吃饭_miniapp.zip`，已解压至 `~/Downloads/_lwjcf_extract/miniapp/`。

页面（8 个，原 `miniprogram/pages/` 下）：index 约饭首页、family 家庭详情、members 成员管理、menu 我的菜单、dishEdit 菜品编辑、order 点菜、receipt 小票、history 历史。

云函数（5 个）：login 静默登录、family 家庭与成员（index.js + actions2.js）、dish 菜品与基础库、meal 约饭点菜下单（index.js + order.js）、initData 初始化食材/口味库。

数据集合（8 个）：users、families、memberships、dishes、meals、meal_items、ingredients、tastes。金额无、以时长求和为主。

模块依赖项：全局样式 `app.wxss`（定义 `page` 级 CSS 变量与 `.card/.btn/.row/.tag/.chip/.empty` 等类）、`utils/api.js`（云函数调用封装，按 family/dish/meal/base 分组）、`utils/util.js`（时间格式化、MEAL_STATUS）、`app.getUser()` 获取登录用户、`tabBar`（约饭 index 与 我的菜单 menu 两个 tab）。页面内跳转均使用 `/pages/xxx` 绝对路径，云函数均通过 `cloud.getWXContext()` 取 OPENID，并在 `users` 集合按自定义字段 `openid` 查当前用户。

## 三、集成冲突与隔离策略

冲突一：云函数 `login` 与宿主 `cloudfunctions/login` 重名，且返回结构不同（宿主返回 `{openid}`，模块返回 `{user}`）。

冲突二：模块 `users` 集合按自定义字段 `openid` 存取、首登默认昵称「干饭人」，宿主 `users` 按系统字段 `_openid` 存取且结构不同，直接共用会互相污染。

冲突三：`utils/api.js`、`utils/util.js` 与宿主 `miniprogram/utils/` 同名文件冲突。

冲突四：模块 `app.wxss` 含 `page{}` 全局规则，合入宿主全局样式会改变整个 App 的背景色、字号与主题色。

冲突五：模块用独立 tabBar（约饭 / 我的菜单），宿主已有自定义 tabBar，无法叠加；集成后模块页面以 `navigateTo` 进入，不能依赖 tabBar 切换。

冲突六：页面注册路径与页面内跳转绝对路径需整体迁移。

隔离策略（对齐既有 splitpal 范式）：

1. 页面整体迁入 `miniprogram/pages/mealtime/` 子目录，8 个页面各占一个子文件夹。
2. 5 个云函数合并为单个云函数 `mealManage`，服务端统一 `cloud.getWXContext()` 取 OPENID；动作名按域命名空间化（如 `family.create`、`dish.save`、`meal.submit`）。
3. 全部集合加 `meal_` 前缀：meal_users、meal_families、meal_memberships、meal_dishes、meal_meals、meal_items、meal_ingredients、meal_tastes，与宿主数据彻底隔离。
4. `getMe()` 改为懒创建：当 meal_users 无当前 openid 记录时自动建档，取消独立 login 步骤；新增 `syncProfile` 动作，由模块首页把宿主昵称/头像同步进 meal_users，保证成员展示真实昵称。
5. 模块全局样式抽到 `pages/mealtime/mealtime-theme.wxss`，仅在各模块页面的 wxss 顶部 `@import`，页面级 `page{}` 仅作用于模块页，不污染宿主全局。
6. 去 tabBar：「我的菜单」改为约饭首页头部的入口按钮，通过 `navigateTo` 进入。
7. `utils/api.js`、`utils/util.js` 迁入 `pages/mealtime/utils/`，页面 require 改为 `../utils/xxx`；`api.js` 改造为调用单一 `mealManage` 并传命名空间动作。
8. 页面内所有 `/pages/xxx` 跳转统一改为 `/pages/mealtime/xxx`。
9. 为宿主 `app.js` 增加轻量 `getUser()` 方法，返回宿主已登录用户，供模块页面头部展示。
