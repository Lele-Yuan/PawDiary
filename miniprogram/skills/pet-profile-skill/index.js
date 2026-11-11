const skill = wx.modelContext.createSkill('/skills/pet-profile-skill');
skill.registerAPI('listPets', require('./apis/listPets'));
skill.registerAPI('getPetProfile', require('./apis/getPetProfile'));
skill.registerAPI('updatePetProfile', require('./apis/updatePetProfile'));
