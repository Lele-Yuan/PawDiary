const skill = wx.modelContext.createSkill('/skills/mealtime-skill');
skill.registerAPI('listMealFamilies', require('./apis/listMealFamilies'));
skill.registerAPI('listFamilyDishes', require('./apis/listFamilyDishes'));
skill.registerAPI('getCurrentMeal', require('./apis/getCurrentMeal'));
skill.registerAPI('listMealHistory', require('./apis/listMealHistory'));
skill.registerAPI('getMealReceipt', require('./apis/getMealReceipt'));
