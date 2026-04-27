# 上门沟通功能实现总结

## 完成情况

全部 6 个任务均已完成。

---

## 新增文件

| 文件 | 说明 |
|------|------|
| `cloudfunctions/visitManage/index.js` | 云函数，8 个 action |
| `cloudfunctions/visitManage/config.json` | 云函数配置 |
| `cloudfunctions/visitManage/package.json` | 云函数依赖 |
| `miniprogram/pages/visit/visit.js` | 历史列表页逻辑 |
| `miniprogram/pages/visit/visit.wxml` | 历史列表页模板 |
| `miniprogram/pages/visit/visit.wxss` | 历史列表页样式 |
| `miniprogram/pages/visit/visit.json` | 历史列表页配置 |
| `miniprogram/pages/visit/visit-add/visit-add.js` | 表单页逻辑（330+ 行）|
| `miniprogram/pages/visit/visit-add/visit-add.wxml` | 表单页模板 |
| `miniprogram/pages/visit/visit-add/visit-add.wxss` | 表单页样式 |
| `miniprogram/pages/visit/visit-add/visit-add.json` | 表单页配置 |

## 修改文件

| 文件 | 修改内容 |
|------|---------|
| `miniprogram/app.json` | 注册 visit、visit-add 两个路由 |
| `miniprogram/pages/profile/profile.wxml` | 在「客服反馈」前插入「上门沟通 🐾」入口 |
| `miniprogram/pages/profile/profile.js` | 增加 `goToVisit()` 导航方法 |

---

## 核心功能实现

### 云函数（visitManage）
- `add`：按 creatorRole 初始化双方 openid，status 默认 pending
- `get`：空缺 openid 时自动绑定；双方绑定后强制权限校验（NO_PERMISSION），按身份过滤私密备注
- `list`：查 ownerOpenid 或 helperOpenid 匹配当前用户的记录，排除 archived
- `update`：仅 pending/preparing 状态可编辑
- `confirm`：按身份更新确认标志，双方均 true 自动流转 preparing
- `checkin`：仅临时主，preparing → serving
- `complete`：仅铲屎官，serving → completed
- `delete`：仅创建者，pending/preparing → archived

### 状态机
```
pending → preparing（双方均确认）→ serving（临时主上门）→ completed（铲屎官确认）
pending/preparing → archived（创建者废弃）
```

### 权限控制
- helperOpenid 未绑定时：任何人可通过分享链接绑定
- 双方均绑定后：仅 owner/helper 可访问，第三方显示无权限提示

### 表单页交互
- 新建时必须先选择角色，当前用户昵称自动填入对应字段
- 底部按钮组根据 `myRole` + `status` 动态渲染
- 废弃按钮仅对创建者（`_openid`）在 pending/preparing 状态显示
- 创建成功后弹窗引导分享，`onShareAppMessage` 根据 creatorRole 生成不同分享文案

---

## 注意事项

1. **云函数需上传部署**：visitManage 为新建云函数，需在微信开发者工具中右键上传部署
2. **数据库集合**：需在云开发控制台手动创建 `visit_records` 集合，建议为 `ownerOpenid`、`helperOpenid`、`updatedAt` 字段建立索引
3. **isCreator 判断**：当前依赖 `app.globalData.userInfo.openid`，需确认 globalData 中有 openid 字段；若无，可改为云函数返回时附带 `isCreator` 字段
