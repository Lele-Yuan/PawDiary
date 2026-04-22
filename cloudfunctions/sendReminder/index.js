const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const NOTIFY_TEMPLATE_ID = 'ZuML7GbjCpKkV5ZvAy1BSvxTa0ns0RhPEZrAGa5MnG8';
// const {RECORD_TYPE_MAP} = require('./../utils/constants');
const RECORD_TYPE_MAP = {
  'weight': '体重',
  'poop': '尿便',
  'diet': '饮食',
  'water': '喝水',
  'deworm': '驱虫',
  'vaccine': '疫苗',
  'checkup': '就医',
  'illness': '给药',
  'heat': '发情',
  'bath': '洗澡',
  'nail': '剪指甲',
  'ear': '洗耳朵',
  'paw': '剃脚毛',
  'gland': '挤肛门腺',
  'teeth': '刷牙',
  'beauty': '美容',
  'disinfect': '消毒',
  'litter': '换猫砂',
  'toy': '洗玩具',
  'cage': '清洁窝笼',
  'abnormal': '异常情况',
};

exports.main = async (event, context) => {
  const now = new Date();
  // 查询 remindSendAt 在过去 1 小时内的记录（兼容触发器延迟）
  const windowStart = new Date(now.getTime() - 60 * 60 * 1000);

  let records = [];
  try {
    const res = await db.collection('records')
      .where({
        enableRemind: true,
        remindSendAt: _.gte(windowStart).and(_.lte(now)),
        remindSentAt: _.or(_.exists(false), _.eq(null))
      })
      .limit(100)
      .get();
    records = res.data || [];
  } catch (err) {
    console.error('查询提醒记录失败', err);
    return { code: -1, message: '查询失败', error: err.message };
  }

  if (records.length === 0) {
    return { code: 0, message: '无需发送', total: 0 };
  }

  const results = [];
  for (const record of records) {
    try {
      // petName 可能为空（旧记录无此字段），补查宠物名称
      var petName = record.petName || '';
      if (!petName && record.petId) {
        try {
          const petRes = await db.collection('pets').doc(record.petId).get();
          if (petRes.data) petName = petRes.data.name || '';
        } catch (e) {}
      }

      // 发送订阅消息
      await cloud.openapi.subscribeMessage.send({
        touser: record._openid,
        templateId: NOTIFY_TEMPLATE_ID,
        page: 'pages/record/record?petId=' + record.petId,
        data: {
          thing4: { value: `${petName.slice(0, 20)} ${(RECORD_TYPE_MAP[record.type] || '').slice(0, 20) || '护理'}提醒` },
          time25:  { value: formatDate(record.nextDate) },
          thing1: { value: (record.title || '到期提醒').slice(0, 20) },
          thing13: { value: record.description || '点击查看详情' }
        }
      });

      // 发送成功后记录发送时间并关闭提醒，双重防止重复推送
      await db.collection('records').doc(record._id).update({
        data: {
          enableRemind: false,
          remindSentAt: new Date()
        }
      });

      results.push({ id: record._id, status: 'sent' });
    } catch (err) {
      console.error('发送失败，记录ID：' + record._id, err);
      results.push({ id: record._id, status: 'failed', error: err.message });
    }
  }

  return { code: 0, total: records.length, results };
};

function formatDate(date) {
  if (!date) return '';
  var d = new Date(date);
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}
