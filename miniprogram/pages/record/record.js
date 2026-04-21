const { formatDate, formatMoney, showLoading, hideLoading, showSuccess, showError } = require('../../utils/util');
const { RECORD_TYPES, RECORD_TYPE_MAP } = require('../../utils/constants');

Page({
  data: {
    activeType: 'all',
    currentPetName: '',
    navTitleOpacity: 1,
    canEdit: true,
    records: [],
    typeList: [],
    loaded: false,
    RECORD_TYPE_MAP
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
    var app = getApp();
    var role = app.globalData.currentPetRole || 'creator';
    this.setData({ canEdit: role === 'creator' || role === 'admin' });
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
          const res = await wx.cloud.callFunction({
            name: 'petManage',
            data: { action: 'list' }
          });
          const pets = (res.result && res.result.code === 0) ? res.result.data : [];
          const pet = pets.find(function(p) { return p._id === petId; });
          if (pet) {
            app.globalData.currentPet = pet;
            this.setData({ currentPetName: pet.name || '' });
          } else {
            this.setData({ currentPetName: '' });
          }
        } catch (e) {
          console.error('获取宠物名称失败', e);
          this.setData({ currentPetName: '' });
        }
      }

      if (!petId) {
        this.setData({ records: [], loaded: true });
        return;
      }

      // 通过云函数获取记录数据
      const res = await wx.cloud.callFunction({
        name: 'recordManage',
        data: {
          action: 'list',
          data: {
            petId,
            type: this.data.activeType
          }
        }
      });

      const data = res.result && res.result.code === 0 ? res.result.data : [];

      var tagClassMap = {
        deworm: 'tag-success',
        checkup: 'tag-info',
        vaccine: 'tag-warning',
        bath: 'tag-purple'
      };

      var now = new Date();
      var nowTime = now.getTime();

      var records = data.map(function (r) {
        var typeInfo = RECORD_TYPE_MAP[r.type] || {};
        var hour = r.hour !== undefined ? r.hour : 12;

        // 根据类型生成详情文本
        var detailText = '';
        switch (r.type) {
          case 'weight':
            detailText = (r.weight || '') + (r.weightUnit || '');
            break;
          case 'diet':
            var foodTypeMap = { 'dry': '干粮', 'wet': '湿粮', 'homemade': '自制' };
            var foodTypeLabel = foodTypeMap[r.foodType] || '';
            detailText = foodTypeLabel + (r.foodAmount || '');
            break;
          case 'water':
            detailText = (r.waterAmount || '') + (r.waterUnit || '');
            break;
          case 'illness':
            var medicationTypeMap = { 'oral': '口服', 'external': '外用', 'rectal': '直肠', 'injection': '注射' };
            detailText = medicationTypeMap[r.medicationType] || '未知方式';
            break;
          case 'poop':
            var poopStatusMap = { 'normal': '正常', 'abnormal': '异常' };
            detailText = poopStatusMap[r.poopStatus] || '未记录';
            break;
          case 'deworm':
            var dewormTypeMap = { 'external': '体外驱虫', 'internal': '体内驱虫', 'both': '内外同驱' };
            detailText = dewormTypeMap[r.dewormType] || '未记录';
            break;
          case 'vaccine':
            var vaccineTypeMap = { 'rabies': '狂犬疫苗', 'infectious': '传染病疫苗' };
            detailText = vaccineTypeMap[r.vaccineType] || '未记录';
            break;
          case 'heat':
            var heatStageMap = { 'started': '开始', 'ended': '结束' };
            detailText = heatStageMap[r.heatStage] || '未记录';
            break;
          default:
            detailText = '';
        }

        var item = {
          _id: r._id,
          type: r.type,
          title: r.title,
          images: r.images,
          date: r.date,
          hour: hour,
          nextDate: r.nextDate,
          enableRemind: r.enableRemind,
          remindInterval: r.remindInterval,
          typeLabel: typeInfo.label || r.type,
          detailText: detailText,
          typeColor: typeInfo.color || '#999',
          tagClass: tagClassMap[r.type] || 'tag-primary',
          dateStr: formatDate(r.date, 'YYYY-MM-DD'),
          shortDateStr: (function() {
            var ds = formatDate(r.date, 'YYYY.MM.DD');
            return ds ? ds.substring(2).replace(/-/g, '.') : '';
          })(),
          hourStr: hour + ':00',
          nextDateStr: r.nextDate ? formatDate(r.nextDate, 'YYYY-MM-DD') : '',
          hasRemind: !!r.enableRemind,
          remainDays: null,
          remindProgress: 0,
          remindOverdue: false,
          remindDaysText: '',
          remindProgressColor: '#249654'
        };

        // 提醒进度计算
        if (r.enableRemind && r.nextDate && r.date) {
          var dateTime = new Date(r.date).getTime();
          var nextTime = new Date(r.nextDate).getTime();
          var totalMs = nextTime - dateTime;

          if (totalMs > 0) {
            var elapsedMs = nowTime - dateTime;
            var progress = Math.min(Math.round(elapsedMs / totalMs * 100), 100);
            var remainDays = Math.ceil((nextTime - nowTime) / 86400000);

            item.remindProgress = Math.max(0, progress);
            item.remindOverdue = remainDays < 0;
            item.remainDays = remainDays;

            if (remainDays >= 0) {
              item.remindDaysText = '\u8fd8\u5269 ' + remainDays + ' \u5929';
            } else {
              item.remindDaysText = '\u5df2\u8d85\u671f ' + Math.abs(remainDays) + ' \u5929';
              item.remindProgress = 100;
            }

            if (remainDays < 0 || progress >= 90) {
              item.remindProgressColor = '#C0392B';
            } else if (progress >= 60) {
              item.remindProgressColor = '#F5A623';
            } else {
              item.remindProgressColor = '#249654';
            }
          }
        }

        return item;
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
    var app = getApp();
    if (!app.globalData.currentPetId) {
      wx.showToast({ title: '请先添加宠物', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/record/record-type-select/record-type-select'
    });
  },

  // 立即完成：携带记录ID跳转到添加页面，先获取数据再预填
  onCompleteRecord(e) {
    var ds = e.currentTarget.dataset;
    var id = ds.id;

    if (!id) {
      showError('记录ID不存在');
      return;
    }

    // 只传递sourceId，在添加页面获取完整记录数据
    wx.navigateTo({
      url: '/pages/record/record-add/record-add?prefill=1&sourceId=' + id
    });
  },

  // 跳转编辑记录
  goEdit(e) {
    if (!this.data.canEdit) {
      wx.showToast({ title: '无权限请联系宠物主', icon: 'none' });
      return;
    }
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/record/record-add/record-add?id=' + id
    });
  },

  // 立即完成：新增当天记录，继承或结束提醒
  async onComplete(e) {
    var id = e.currentTarget.dataset.id;
    var record = null;
    var records = this.data.records;
    for (var i = 0; i < records.length; i++) {
      if (records[i]._id === id) { record = records[i]; break; }
    }
    if (!record) return;

    var app = getApp();
    var petId = app.globalData.currentPetId;
    if (!petId) return;

    var db = wx.cloud.database();
    var now = new Date();
    var todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

    // 是否继续提醒：有提醒设置且未超期
    var continueRemind = !!record.enableRemind && record.remindInterval > 0 && !record.remindOverdue;
    var newNextDate = null;
    if (continueRemind) {
      var base = new Date(todayStr);
      base.setDate(base.getDate() + record.remindInterval);
      newNextDate = base;
    }

    try {
      showLoading('完成中...');

      // 新增完成记录
      await db.collection('records').add({
        data: {
          petId: petId,
          type: record.type,
          date: new Date(todayStr),
          title: record.title,
          description: '',
          location: record.location || '',
          cost: 0,
          nextDate: newNextDate,
          enableRemind: continueRemind,
          remindInterval: continueRemind ? record.remindInterval : 0,
          images: [],
          createdAt: new Date()
        }
      });

      // 关闭原记录的提醒
      await db.collection('records').doc(id).update({
        data: {
          enableRemind: false,
          nextDate: null
        }
      });

      hideLoading();
      showSuccess('已完成');
      this.loadRecords();
    } catch (err) {
      console.error('完成记录失败', err);
      hideLoading();
      showError('操作失败');
    }
  },

  // 长按删除记录
  onLongPressRecord(e) {
    if (!this.data.canEdit) {
      wx.showToast({ title: '无权限请联系宠物主', icon: 'none' });
      return;
    }

    const id = e.currentTarget.dataset.id;
    wx.showActionSheet({
      itemList: ['删除此记录'],
      success: function(res) {
        if (res.tapIndex === 0) {
          wx.showModal({
            title: '确认删除',
            content: '删除后无法恢复，确定要删除吗？',
            confirmColor: '#F44336',
            success: function(modalRes) {
              if (modalRes.confirm) {
                try {
                  const db = wx.cloud.database();
                  db.collection('records').doc(id).remove().then(function() {
                    wx.showToast({ title: '已删除', icon: 'success' });
                    that.loadRecords();
                  }).catch(function(err) {
                    console.error('删除失败：', err);
                    wx.showToast({ title: '删除失败', icon: 'none' });
                  });
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