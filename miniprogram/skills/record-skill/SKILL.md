# 宠物记录 SKILL

帮助用户用自然语言管理宠物日常记录：新增、查询、删除。

## 业务流程

```
用户意图
├─ 新增（"记一下来福今天体重 5.2kg""帮豆豆加一条驱虫记录"）
│      └─> addRecord --> record-card
├─ 查询（"看看豆豆最近的体重""上次打疫苗是什么时候""最近一周的饮食"）
│      └─> listRecords --> record-list-card
└─ 删除（"把刚才那条删掉""删除某条记录"）
       └─> 先 listRecords 让用户点选 --> deleteRecord --> record-card
```

## 宠物解析规则（铁律）

- 用户话语中**明确提到宠物名字**（如"来福""豆豆""毛毛"）时，必须把名字写入 `petName` 参数
- 用户**没有提到任何宠物名字**时，禁止猜测、禁止编造，**不要填写 `petName`**（SKILL 内部会使用当前选中的宠物）
- 当 `petName` 找不到对应宠物时，SKILL 会返回错误信息，应原样转述给用户，不要回退到其他宠物

## 类型映射（用户措辞 → type）

- 体重 / 称重 → `weight`（必须带 weight 数值）
- 吃饭 / 喂食 / 饮食 → `diet`
- 喝水 / 饮水 → `water`
- 拉屎 / 排便 → `poop`
- 驱虫 / 打虫 → `deworm`
- 疫苗 / 打针 → `vaccine`
- 体检 / 检查身体 → `checkup`
- 生病 / 看病 / 就诊 → `illness`
- 洗澡 → `bath`
- 剪指甲 → `nail`
- 清耳朵 → `ear`
- 修毛 / 修脚毛 → `paw`
- 挤肛门腺 → `gland`
- 刷牙 → `teeth`
- 美容 / 造型 → `beauty`
- 消毒 → `disinfect`
- 换猫砂 → `litter`
- 换玩具 → `toy`
- 清笼子 → `cage`
- 异常 / 不舒服 → `abnormal`
- 发情 → `heat`
- 拆家 / 捅娄子 → `trouble`
- 偷吃 → `stealfood`

## 业务约束（铁律）

- `addRecord` 仅当返回 `isError=false` 才算成功，未成功前禁止向用户宣布"已记录"
- `deleteRecord` 的 `recordId` 必须来自 `listRecords` 返回的原值，禁止编造或从用户措辞推断；上下文中没有可用 recordId 时，先调 `listRecords` 让用户从卡片中点选
- 用户只说"记一下"未给具体内容时，先反问"想记录什么内容"
- 数值字段（体重、饮水量等）用户必须明确给出，不可猜测
- 日期字段：用户未提日期时使用今天（ISO 字符串）；用户说"昨天/上周三/3 月 15 日"时由模型解析为 ISO 字符串

## 意图分流

- 给出具体内容 → `addRecord`
- 仅询问/查看 → `listRecords`
- 表达模糊（"那个""上次"）→ 先反问澄清，禁止猜测
