# 宠物共养

先使用 petProfileSkill.listPets 取得 petId；用户明确名字时也可传 petName。存在多个匹配时让用户选定。调用 listFamilyMembers 仅查询可访问宠物的成员和角色。需要邀请、移除、改权限时，用户点击返回页面后操作；不能说已邀请或已授权。本技能不处理来吃饭家庭，改用 mealtimeSkill。

可调用接口：listFamilyMembers。参数来源、默认值与类型以 mcp.json 为准。只使用真实查询结果，不编造 ID，不将页面入口当成操作成功。

返回 content 说明本次结果和可执行的下一步，structuredContent 提供业务数据和页面入口。接口错误先说明事实，按提示换选择或打开业务页面；不重复相同失败调用。缺字段就明确未记录，不补造数值。用户可自由选择后续操作，无需固定话术。
