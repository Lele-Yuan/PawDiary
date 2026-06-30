const listUpcomingReminders = require('./apis/listUpcomingReminders');
const getNextReminderByType = require('./apis/getNextReminderByType');

const skill = wx.modelContext.createSkill('/skills/reminder-skill');
skill.registerAPI('listUpcomingReminders', listUpcomingReminders);
skill.registerAPI('getNextReminderByType', getNextReminderByType);
