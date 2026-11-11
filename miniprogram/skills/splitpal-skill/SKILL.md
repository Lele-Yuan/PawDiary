# 活动分账

先 listActivities 取得 activities[]._id；多活动或名称相同时必须让用户选择。再按问题调用 getActivityOverview、listActivityBills 或 listSettlements。所有金额单位 fen，人民币元等于返回值除以 100，不能混用 billSkill 的元。总额使用概况，不对截断账单求总额。应分摊不是尚欠；活动合计待结算不是个人欠款。结算查询只读取已保存记录，空记录不表示零欠款。生成结算、改账、标记已付均由用户点击活动入口操作，不能自动转账或宣称银行到账。

可调用接口：listActivities、getActivityOverview、listActivityBills、listSettlements。参数来源、默认值与类型以 mcp.json 为准。只使用真实查询结果，不编造 ID，不将页面入口当成操作成功。

返回 content 说明本次结果和可执行的下一步，structuredContent 提供业务数据和页面入口。接口错误先说明事实，按提示换选择或打开业务页面；不重复相同失败调用。缺字段就明确未记录，不补造数值。用户可自由选择后续操作，无需固定话术。
