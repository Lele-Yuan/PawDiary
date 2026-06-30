const addBill = require('./apis/addBill');
const listBills = require('./apis/listBills');
const getMonthlyStats = require('./apis/getMonthlyStats');

const skill = wx.modelContext.createSkill('/skills/bill-skill');
skill.registerAPI('addBill', addBill);
skill.registerAPI('listBills', listBills);
skill.registerAPI('getMonthlyStats', getMonthlyStats);
