# 宠物账单 SKILL

帮助用户用自然语言管理宠物消费账单：记账、查询、月度统计。

## 业务流程

```
用户意图
├─ 记账（"给来福记一笔狗粮 199""今天买玩具花了 50"）
│      └─> addBill --> bill-card
├─ 查询明细（"看看 3 月份的账单""最近的开销"）
│      └─> listBills --> bill-list-card
└─ 月度统计（"这个月花了多少""医疗花了多少""上月环比"）
       └─> getMonthlyStats --> bill-stats-card
```

## 宠物解析规则（铁律）

- 用户明确提到宠物名字时，必须把名字写入 `petName`
- 用户未提到宠物名字时，**不要**填写 `petName`，禁止猜测
- petName 找不到对应宠物时，SKILL 返回错误信息原样转述，不要回退

## 分类映射（用户措辞 → category）

- 狗粮 / 猫粮 / 零食 / 罐头 → `food`
- 看病 / 疫苗 / 驱虫药 / 体检 / 药 → `medical`
- 玩具 → `toy`
- 洗澡 / 美容 / 剃毛 / 造型 → `grooming`
- 猫砂 / 牵引绳 / 项圈 / 笼子 / 用品 → `daily`
- 其他 → `other`

## 业务约束（铁律）

- `addBill.amount` 必须是用户明确给出的具体数值；用户说"几十块""差不多"等模糊表达时，必须先反问"具体多少钱"
- 询问"花了多少钱"统一调用 `getMonthlyStats`，**禁止**调用 `listBills` 后自行求和
- 仅当 `addBill` 返回 `isError=false` 才宣布"已记账"
- 金额单位为元，SKILL 不做单位换算

## 意图分流

- 给出具体金额 + 用途 → `addBill`
- 询问总额 / 占比 / 环比 → `getMonthlyStats`
- 询问明细列表 → `listBills`
