const skill = wx.modelContext.createSkill('/skills/pet-map-skill');
skill.registerAPI('searchPlaces', require('./apis/searchPlaces'));
skill.registerAPI('getPlaceDetail', require('./apis/getPlaceDetail'));
