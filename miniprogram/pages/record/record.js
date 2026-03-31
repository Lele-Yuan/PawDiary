const { formatDate, formatMoney } = require('../../utils/util');
const { RECORD_TYPES, RECORD_TYPE_MAP } = require('../../utils/constants');

Page({
  data: {
    activeType: 'all',
    currentPetName: '',
    navTitleOpacity: 1,
    records: [],
    typeList: [],
    loaded: false
  },

  onLoad() {
    const typeList = [{ key: 'all', label: '全部' }];
    RECORD_TYPES.forEach(function (t) {
      typeList.push({ key: t.key, label: t.label });
    });
    this.setData({ typeList: typeList });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.loadRecords();
  },

  onPageScroll(e) {
    const threshold = 150;
    const opacity = Math.max(0, 1 - e.scrollTop / threshold);
    if (Math.abs(opacity - this.data.navTitleOpacity) > 0.05 || opacity === 0 || opacity === 1) {
      this.setData({ navTitleOpacity: Math.round(opacity * 100) / 100 });
    }
  },

  // 加载记录列表
  async loadRecords() {
    try {
      const app = getApp();
      const petId = app.globalData.currentPetId;

      // 获取当前宠物名称
      if (app.globalData.currentPet) {
        this.setData({ currentPetName: app.globalData.currentPet.name });
      } else if (petId) {
        try {
          const { data: pet } = await wx.cloud.database().collection('pets').doc(petId).get();
          this.setData({ currentPetName: pet.name || '' });
        } catch (e) {
          console.error('获取宠物名称失败', e);
        }
      }

      if (!petId) {
        this.setData({ records: [], loaded: true });
        return;
      }

      const db = wx.cloud.database();
      const where = { petId };
      if (this.data.activeType !== 'all') {
        where.type = this.data.activeType;
      }

      const { data } = await db.collection('records')
        .where(where)
        .orderBy('date', 'desc')
        .limit(50)
        .get();

      const tagClassMap = {
        deworm: 'tag-success',
        checkup: 'tag-info',
        vaccine: 'tag-warning',
        bath: 'tag-purple'
      };

      const records = data.map(r => {
        const typeInfo = RECORD_TYPE_MAP[r.type] || {};
        return {
          ...r,
          typeLabel: typeInfo.label || r.type,
          typeColor: typeInfo.color || '#999',
          tagClass: tagClassMap[r.type] || 'tag-primary',
          dateStr: formatDate(r.date, 'YYYY-MM-DD'),
          costStr: formatMoney(r.cost),
          nextDateStr: r.nextDate ? formatDate(r.nextDate, 'YYYY-MM-DD') : ''
        };
      });

      this.setData({ records, loaded: true });
    } catch (err) {
      console.error('加载记录失败：', err);
      this.setData({ loaded: true });
    }
  },

  // 切换类型
  switchType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ activeType: type });
    this.loadRecords();
  },

  // 跳转添加记录
  goAdd() {
    wx.navigateTo({
      url: '/pages/record/record-add/record-add'
    });
  },

  // 长按删除记录
  onLongPressRecord(e) {
    const id = e.currentTarget.dataset.id;
    wx.showActionSheet({
      itemList: ['删除此记录'],
      success: async (res) => {
        if (res.tapIndex === 0) {
          wx.showModal({
            title: '确认删除',
            content: '删除后无法恢复，确定要删除吗？',
            confirmColor: '#F44336',
            success: async (modalRes) => {
              if (modalRes.confirm) {
                try {
                  const db = wx.cloud.database();
                  await db.collection('records').doc(id).remove();
                  wx.showToast({ title: '已删除', icon: 'success' });
                  this.loadRecords();
                } catch (err) {
                  console.error('删除失败：', err);
                  wx.showToast({ title: '删除失败', icon: 'none' });
                }
              }
            }
          });
        }
      }
    });
  },

  // 预览图片
  previewImage(e) {
    const { urls, current } = e.currentTarget.dataset;
    wx.previewImage({
      current,
      urls
    });
  }
});