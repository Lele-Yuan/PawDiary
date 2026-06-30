# 家庭成员邀请角色化改造 - 完成总结

## 完成范围

按 `doc.md` / `tasks.md` 规划，6 个任务全部落地：

| 任务 | 状态 | 主要产物 |
| --- | --- | --- |
| Task 1 | ✅ | `cloudfunctions/familyManage/index.js#joinFamily` 支持 role 参数与 member→admin 升级 |
| Task 2 | ✅ | `pages/invite/invite.{js,wxml}` 解析 role、按身份提示文案、复用云函数升级语义 |
| Task 3 | ✅ | 首页邀请按钮改为弹出选择浮层（共养人 / 亲友团） |
| Task 4 | ✅ | 首页家庭成员标题右侧新增"进入家庭 ›"入口 |
| Task 5 | ✅ | 新建 `pages/family-members/family-members.*` 双 tab 列表页 |
| Task 6 | ✅ | 完成边界自查（升级、保持、兼容旧卡） |

## 文件变更清单

**新增**
- `miniprogram/pages/family-members/family-members.js`
- `miniprogram/pages/family-members/family-members.wxml`
- `miniprogram/pages/family-members/family-members.wxss`
- `miniprogram/pages/family-members/family-members.json`

**修改**
- `cloudfunctions/familyManage/index.js`：`joinFamily` 重写，新增升级逻辑、返回 `role`/`upgraded` 字段
- `miniprogram/pages/invite/invite.js`：data 增加 `inviteRole` / `currentRole`；`onJoin` 区分升级/切换；`doJoin` 携带 role 并采用云端返回 role
- `miniprogram/pages/invite/invite.wxml`：按邀请角色与现有身份分支按钮文案、新增"升级为共养人"分支
- `miniprogram/pages/home/home.js`：data 新增 `showInvitePicker`/`inviteRole`；新增 `onShowInvitePicker`/`onHideInvitePicker`/`onPickInviteRole`/`goFamilyMembers`/`noop`；`onShareAppMessage` 携带 role 与差异化文案
- `miniprogram/pages/home/home.wxml`：标题增加"进入家庭"入口；邀请按钮改为弹层触发；新增邀请类型浮层
- `miniprogram/pages/home/home.wxss`：section-header 横向布局、邀请浮层样式
- `miniprogram/app.json`：注册 `pages/family-members/family-members`

## 关键实现要点

1. **角色升级语义（云端权威）**
   - 云函数 `joinFamily` 内置规则：
     - 未加入：按 `data.role` 写入 admin / member
     - 已是 member 且邀请为 admin → 升级为 admin
     - 已是 admin / creator：不变（共养人不会被亲友团卡片降级）
     - 非法 role 一律降级为 member（兼容旧分享卡）

2. **首页邀请触发链**
   - 用户点击"邀请成员" → 弹出浮层 → 浮层中的两个按钮都是 `open-type="share"`
   - 按钮 `bindtap=onPickInviteRole` 在 `onShareAppMessage` 触发前先把当前选择写入 `this._inviteRole`（实例属性，避免 setData 异步）
   - `onShareAppMessage` 读取后构造差异化 path + title

3. **家庭成员管理页**
   - 双 tab：共养人（含 creator）/ 亲友团
   - 创建者展示操作按钮（改为亲友团 / 变成共养人），其他成员仅展示
   - 复用 `familyManage` 的 `list` / `updateRole` 接口，无新接口

4. **invite 页升级路径**
   - 加载时查询 pet_members 取得 `currentRole`
   - 已是 member + 卡片 admin → 显示"升级为共养人"按钮，调用 doJoin 触发云端升级
   - 已是 admin/creator + 任意卡片 → 切换/已加入态（不再调用 join）

## 兼容性

- 旧分享卡（path 不带 role）：云函数视为 member，行为与改造前一致。
- 现有"长按成员管理"逻辑保持，新管理页操作与之等价。

## 自测建议（人工验证）

- 用 A 创建宠物，用 B 通过共养人卡加入 → B 应为 admin。
- 用 B 通过亲友团卡加入 → B 为 member；再点共养人卡加入 → 升级为 admin。
- 用 admin 用户 B 点亲友团卡 → 提示"已是家庭成员"，仍为 admin。
- 创建者进入"进入家庭" → 可在两个 tab 之间切换并修改身份；非创建者进入仅查看。
