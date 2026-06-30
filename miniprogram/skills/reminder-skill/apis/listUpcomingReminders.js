const { resolvePet, bizErrorResult } = require('./_resolvePet');
const { queryReminders, mapReminder, TYPE_TEXT_MAP } = require('./_reminderUtils');

async function listUpcomingReminders(params) {
  try {
    const { petName, withinDays, type } = params || {};
    const { petId, petName: resolvedName } = await resolvePet(petName);
    const records = await queryReminders(petId, { withinDays, type });
    const reminders = records.map(mapReminder);

    const typeText = type ? (TYPE_TEXT_MAP[type] || type) : '';
    const text = reminders.length === 0
      ? `${resolvedName} 近期暂无${typeText ? typeText + '相关' : ''}提醒`
      : `查询到 ${resolvedName} 近期${typeText ? typeText + '相关' : ''}提醒共 ${reminders.length} 条，最近：${reminders[0].title}（${reminders[0].diffLabel}）`;

    return {
      isError: false,
      content: [{ type: 'text', text }],
      structuredContent: { petName: resolvedName, total: reminders.length, reminders }
    };
  } catch (e) {
    if (e && e.__skillBiz) return bizErrorResult(e.message);
    return bizErrorResult('系统异常：' + (e && e.message ? e.message : 'unknown'));
  }
}

module.exports = listUpcomingReminders;
