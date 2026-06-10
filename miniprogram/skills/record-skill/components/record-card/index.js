Component({
  properties: {
    data: { type: Object, value: {} }
  },
  data: {
    typeEmojiMap: {
      weight: '⚖️', poop: '💩', diet: '🍖', water: '💧',
      deworm: '🪲', vaccine: '💉', checkup: '🩺', illness: '🤒',
      bath: '🛁', nail: '✂️', ear: '👂', paw: '🐾', gland: '🍑', teeth: '🪥', beauty: '💇',
      disinfect: '🧴', litter: '🪣', toy: '🧸', cage: '🏠',
      abnormal: '⚠️', heat: '🌡️', trouble: '💥', stealfood: '🍗'
    },
    typeNameMap: {
      weight: '体重', poop: '排便', diet: '饮食', water: '饮水',
      deworm: '驱虫', vaccine: '疫苗', checkup: '体检', illness: '生病',
      bath: '洗澡', nail: '剪指甲', ear: '清耳', paw: '修毛', gland: '挤腺', teeth: '刷牙', beauty: '美容',
      disinfect: '消毒', litter: '换砂', toy: '玩具', cage: '清笼',
      abnormal: '异常', heat: '发情', trouble: '捅娄子', stealfood: '偷吃'
    }
  }
});
