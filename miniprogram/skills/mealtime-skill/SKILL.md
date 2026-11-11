# 家庭来吃饭

先 listMealFamilies 取得 families[]._id，家庭名称相同或多项时让用户选择。用 familyId 调用 listFamilyDishes、getCurrentMeal 或 listMealHistory。当前 meal._id 与历史 meals[].mealId 才能用于 getMealReceipt，不能把 familyId 或 petId 当 mealId。myPicks/counts 中菜品 ID 结合 listFamilyDishes 返回菜单解释，未知 ID 不猜菜名。空菜单可换关键词或打开家庭饭局页面维护；当前无约饭可到页面开桌。开桌、选菜、取消、下单和完成只提供页面衔接，不通过技能写入。耗时分钟，仅是菜谱估计，不能当作准确就餐时间。人类饭局菜单与宠物饮食记录分开；食材不保证过敏或宠物食用安全。

可调用接口：listMealFamilies、listFamilyDishes、getCurrentMeal、listMealHistory、getMealReceipt。参数来源、默认值与类型以 mcp.json 为准。只使用真实查询结果，不编造 ID，不将页面入口当成操作成功。

返回 content 说明本次结果和可执行的下一步，structuredContent 提供业务数据和页面入口。接口错误先说明事实，按提示换选择或打开业务页面；不重复相同失败调用。缺字段就明确未记录，不补造数值。用户可自由选择后续操作，无需固定话术。
