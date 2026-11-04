# 来我家吃饭（mealtime）邀请分享与成员管理增强设计

## 一、需求概述

当前模块已具备「输入邀请码加入家庭」与「待审批」流程，本次补全两组后续能力：

其一，微信转发分享闭环。发起人/成员可把家庭转发给微信好友，好友点开分享卡片后自动带上邀请码进入小程序并一键加入（需审批的家庭则自动提交申请）。

其二，成员与审批管理增强。新增退出家庭、解散家庭（仅发起人）、刷新邀请码（管理员）三项操作。

本次改动不影响既有记账/点菜/小票流程，云端集合仍为 `meal_` 前缀，与宿主隔离。

## 二、现状与缺口

已存在：`family.create` 生成 6 位邀请码；`family.join(inviteCode)` 加入；首页 `openJoin/doJoin` 输入码加入；成员页 `approve` 审批；family 详情 `copyCode` 复制邀请码。

缺口：无任何 `onShareAppMessage`，分享卡片进入自动加入的闭环缺失；成员无法退出、发起人无法解散、管理员无法更换邀请码。

## 三、方案设计

### A. 转发分享闭环

family 详情页新增微信转发：`onShareAppMessage` 返回邀请卡片，路径指向首页并携带邀请码：

```js
onShareAppMessage() {
  const f = this.data.detail.family;
  return {
    title: `「${f.name}」约你来家里吃饭🍚`,
    path: `/pages/mealtime/index/index?inviteCode=${f.inviteCode}`
  };
}
```

family.wxml 顶部新增一个 `<button open-type="share">邀请家人加入</button>` 触发转发。

首页 `index.js` 的 `onLoad(options)` 检测 `options.inviteCode`：存在则在用户就绪后自动调用加入逻辑 `autoJoin(code)`，加入成功跳家庭详情，需审批则提示「申请已提交」。原 `doJoin` 复用同一 `autoJoin` 逻辑。首页同时补一个 `onShareAppMessage` 以支持再次转发。

### B. 成员与审批管理增强

云函数 `mealManage/family.js` 新增 3 个 action（集合均 `meal_` 前缀）：

- `leave`：成员退出。校验我是在册成员；若我是发起人则拒绝（提示先解散）；将我的 membership 置为 status=2。
- `dissolve`：发起人解散。校验发起人身份；批量删除该家庭的 `meal_memberships`、`meal_meals`、`meal_items`，再删除 `meal_families` 文档。
- `refreshCode`：管理员刷新邀请码。校验管理员；生成新的唯一 6 位码并更新 family。

新增批量删除辅助 `removeAll(col, where)`（分页循环删，每批 100）。

`utils/api.js` 新增封装：`family.leave(familyId)`、`family.dissolve(familyId)`、`family.refreshCode(familyId)`。

family 详情页新增方法与入口：

- `refreshCode()`：管理员可见「🔄 换码」按钮，二次确认后刷新并 `load()`。
- `leaveFamily()`：非发起人可见「退出家庭」，确认后调用并 `navigateBack`。
- `dissolveFamily()`：发起人可见「解散家庭」，确认后调用并 `navigateBack`。

## 四、受影响文件

- `cloudfunctions/mealManage/family.js`（新增 leave/dissolve/refreshCode 与 removeAll）
- `miniprogram/pages/mealtime/utils/api.js`（新增 3 个封装）
- `miniprogram/pages/mealtime/family/family.js`（新增 share、refreshCode、leave、dissolve）
- `miniprogram/pages/mealtime/family/family.wxml`（分享按钮、换码按钮、退出/解散入口）
- `miniprogram/pages/mealtime/family/family.wxss`（新增按钮样式，走现有变量）
- `miniprogram/pages/mealtime/index/index.js`（onLoad 自动加入、onShareAppMessage、autoJoin 重构 doJoin）

不改数据结构，仅在既有集合上增删操作。

## 五、边界与异常

- 非成员分享进入：join 懒创建用户后按邀请码加入；邀请码失效提示「邀请码无效」。
- 已是成员再次点分享进入：join 返回已是成员，直接进入家庭详情。
- 发起人退出：拦截并提示先解散。
- 解散为不可逆操作，前端二次确认；云端按家庭维度清理，不触碰其它家庭数据。
- 刷新邀请码后旧码立即失效（符合预期）。

## 六、预期结果

好友点开转发卡片即可自动加入或提交申请；成员可退出、发起人可解散、管理员可换码。全部操作走 `mealManage` 单云函数与 `meal_` 集合，样式沿用模块珊瑚主题。上线前需重新部署 `mealManage` 云函数使新 action 生效。
