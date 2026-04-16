Page({
  data: {
    healthTypes: [
      { key: 'weight', label: '体重', icon: '⚖️' },
      { key: 'poop', label: '尿便', icon: '💩' },
      { key: 'diet', label: '饮食', icon: '🍖' },
      { key: 'water', label: '喝水', icon: '💧' },
      { key: 'deworm', label: '驱虫', icon: '🐜' },
      { key: 'vaccine', label: '疫苗', icon: '💉' },
      { key: 'checkup', label: '体检', icon: '🩺' },
      { key: 'illness', label: '给药', icon: '🏥' }
    ],
    groomingTypes: [
      { key: 'bath', label: '洗澡', icon: '🛁' },
      { key: 'nail', label: '剪指甲', icon: '💅' },
      { key: 'ear', label: '洗耳朵', icon: '👂' },
      { key: 'paw', label: '踢脚毛', icon: '🐾' },
      { key: 'gland', label: '挤肛门腺', icon: '💉' },
      { key: 'teeth', label: '刷牙', icon: '🦷' },
      { key: 'beauty', label: '美容', icon: '✂️' }
    ],
    cleaningTypes: [
      { key: 'disinfect', label: '消毒', icon: '🧴' },
      { key: 'litter', label: '换猫砂', icon: '🏝️' },
      { key: 'toy', label: '洗玩具', icon: '🧸' },
      { key: 'cage', label: '清洁窝笼', icon: '🏠' }
    ],
    abnormalTypes: [
      { key: 'abnormal', label: '异常情况', icon: '⚠️' }
    ]
  },

  // 选择记录类型
  selectType(e) {
    const type = e.currentTarget.dataset.key;
    wx.navigateTo({
      url: `/pages/record/record-add/record-add?type=${type}`
    });
  }
});
