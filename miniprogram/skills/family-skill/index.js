const skill = wx.modelContext.createSkill('/skills/family-skill');
skill.registerAPI('listFamilyMembers', require('./apis/listFamilyMembers'));
