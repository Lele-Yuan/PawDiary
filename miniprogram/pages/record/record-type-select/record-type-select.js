const { RECORD_TYPE_MAP } = require('../../../utils/constants');

Page({
  data: {
    healthTypes: [
      RECORD_TYPE_MAP.weight,
      RECORD_TYPE_MAP.poop,
      RECORD_TYPE_MAP.diet,
      RECORD_TYPE_MAP.water,
      RECORD_TYPE_MAP.deworm,
      RECORD_TYPE_MAP.vaccine,
      RECORD_TYPE_MAP.checkup,
      RECORD_TYPE_MAP.illness,
      RECORD_TYPE_MAP.heat,
    ],
    groomingTypes: [
      RECORD_TYPE_MAP.bath,
      RECORD_TYPE_MAP.nail,
      RECORD_TYPE_MAP.ear,
      RECORD_TYPE_MAP.paw,
      RECORD_TYPE_MAP.gland,
      RECORD_TYPE_MAP.teeth,
      RECORD_TYPE_MAP.beauty,
    ],
    cleaningTypes: [
      RECORD_TYPE_MAP.disinfect,
      RECORD_TYPE_MAP.litter,
      RECORD_TYPE_MAP.toy,
      RECORD_TYPE_MAP.cage,
    ],
    abnormalTypes: [
      RECORD_TYPE_MAP.abnormal,
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
