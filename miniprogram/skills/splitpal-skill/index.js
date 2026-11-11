const skill = wx.modelContext.createSkill('/skills/splitpal-skill');
skill.registerAPI('listActivities', require('./apis/listActivities'));
skill.registerAPI('getActivityOverview', require('./apis/getActivityOverview'));
skill.registerAPI('listActivityBills', require('./apis/listActivityBills'));
skill.registerAPI('listSettlements', require('./apis/listSettlements'));
