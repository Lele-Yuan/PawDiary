# 来我家吃饭（mealtime）模块集成总结

## 完成情况

已将独立小程序「来吃饭」的全部功能集成进 PawDiary，并在「我的」页「常用功能」区的「记账分账」之后新增「来吃饭」入口。全部 7 个任务完成，新模块与宿主数据、样式、云函数完全隔离，未改动 PawDiary 任何既有功能。

## 主要改动

云函数：新增单一云函数 `cloudfunctions/mealManage/`，合并原模块的 login/family/dish/meal/initData 五个云函数。入口 `index.js` 负责动作路由、`getMe` 懒创建用户、`syncProfile` 同步资料与 `base.seed` 初始化基础库；业务逻辑拆分为 `family.js`、`dish.js`、`meal.js`、`order.js`。动作按域命名空间调用，例如 `family.create`、`dish.save`、`meal.submit`。

页面：原 8 个页面迁入 `miniprogram/pages/mealtime/` 子目录（index/family/members/menu/dishEdit/order/receipt/history），页面内 `require` 改为 `../utils/`，跳转路径统一改为 `/pages/mealtime/...`，各页 wxss 顶部 `@import "../mealtime-theme.wxss"`，各页 json 设置绿色导航栏。

工具与样式：新增 `pages/mealtime/utils/util.js`、`pages/mealtime/utils/api.js`（改造为统一调用 mealManage）、`pages/mealtime/mealtime-theme.wxss`（模块主题，仅模块页生效，不污染宿主全局样式）。

宿主改动：`app.json` 注册 8 个新页面；`app.js` 新增 `getUser()` 方法；`profile.wxml` 新增「来吃饭」入口，`profile.js` 新增 `goMealtime()`；约饭首页头部新增「我的菜单」入口按钮（替代原 tabBar 切换）。

## 冲突隔离要点

原模块 `login` 云函数与宿主重名、`users` 集合结构与宿主冲突、`utils` 与全局 `app.wxss` 会污染宿主、tabBar 无法叠加。处理方式：云函数合并为 mealManage 并服务端取 OPENID；全部集合加 `meal_` 前缀与宿主彻底隔离；用户在 `meal_users` 独立建档并懒创建；样式按页 @import 不进全局；菜单改为首页入口。

## 验证

对 mealManage 全部 js、mealtime 全部页面 js 执行 `node --check` 均通过；`app.json` 与各页 json 通过 JSON.parse 校验；确认 8 个页面各含 wxml/wxss/js/json 四件套，无残留 `../../utils` 与未加前缀的 `/pages/` 引用。小程序运行态需在微信开发者工具中编译预览确认。

## 上线前手动步骤

1. 微信开发者工具中右键 `cloudfunctions/mealManage` → 上传并部署：云端安装依赖。
2. 在云开发控制台创建 8 个集合：`meal_users`、`meal_families`、`meal_memberships`、`meal_dishes`、`meal_meals`、`meal_items`、`meal_ingredients`、`meal_tastes`（权限建议「仅创建者可读写」，云函数不受限）。
3. 在云开发控制台对 `mealManage` 云函数发起一次测试调用，传入 `{ "action": "base.seed" }`，初始化系统食材库与口味库。
4. 菜品图片走云存储 `dishes/` 目录，默认权限即可。

完成后编译预览，从「我的」页点击「来吃饭」即可进入使用。

## 待办与提示

成员昵称/头像在成员首次打开本模块后由 `syncProfile` 同步进 `meal_users`，未进入过的成员在他人视角暂显示默认「干饭人」，属预期行为。原模块设计约束保留：一个家庭同时只能有一次进行中的约饭，下单后不可再增减菜品。
