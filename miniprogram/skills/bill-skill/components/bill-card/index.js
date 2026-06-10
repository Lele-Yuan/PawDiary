Component({
  properties: { data: { type: Object, value: {} } },
  data: {
    categoryEmojiMap: { food: '🍖', medical: '💊', toy: '🧸', grooming: '✂️', daily: '🧴', other: '📦' },
    categoryNameMap:  { food: '食物', medical: '医疗', toy: '玩具', grooming: '美容', daily: '日用', other: '其他' }
  }
});
