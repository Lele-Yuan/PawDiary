const listChecklists=require('./apis/listChecklists');
const skill=wx.modelContext.createSkill('/skills/checklist-skill');
skill.registerAPI('listChecklists',listChecklists);
