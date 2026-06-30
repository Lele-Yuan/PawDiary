const addRecord = require('./apis/addRecord');
const listRecords = require('./apis/listRecords');
const deleteRecord = require('./apis/deleteRecord');

const skill = wx.modelContext.createSkill('/skills/record-skill');
skill.registerAPI('addRecord', addRecord);
skill.registerAPI('listRecords', listRecords);
skill.registerAPI('deleteRecord', deleteRecord);
