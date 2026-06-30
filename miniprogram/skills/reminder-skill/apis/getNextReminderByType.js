const { resolvePet, bizErrorResult } = require('./_resolvePet');
const { queryReminders, mapReminder, TYPE_TEXT_MAP } = require('./_reminderUtils');

async function getNextReminderByType(params) {
  try {
    const { petName, type } = params || {};
    if (!type) return bizErrorResult('缺少 type');
    const { petId, petName: resolvedName } = await resolvePet(petName);
    const records = await queryReminders(petId, { withinDays: 365, type });
    const next = records.length > 0 ? records[0] : null;
    const typeText = TYPE_TEXT_MAP[type] || type;

    if (!next) {
      return {
        isError: false,
        content: [{ type: 'text', text: `${resolvedName} 暂无${typeText}提醒` }],
        structuredContent: { petName: resolvedName, type, total: 0, reminders: [] }
      };
    }
    const item = mapReminder(next);
    const text = `${resolvedName} 下次${typeText}：${item.title}（${item.diffLabel}，${item.nextDate}）`;
    return {
      isError: false,
      content: [{ type: 'text', text }],
      structuredContent: { petName: resolvedName, type, total: 1, reminders: [item] }
    };
  } catch (e) {
    if (e && e.__skillBiz) return bizErrorResult(e.message);
    return bizErrorResult('系统异常：' + (e && e.message ? e.message : 'unknown'));
  }
}

module.exports = getNextReminderByType;
