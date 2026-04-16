const { daysBetween, formatDate, handleAvatarError } = require('../../utils/util');
const { RECORD_TYPE_MAP } = require('../../utils/constants');

// 将宠物对象中的 Date 字段序列化为 ISO 字符串，避免 setData 跨线程传输时 Date → {} 的问题
function serializePet(pet) {
  if (!pet) return pet;
  const result = { ...pet };
  ['birthday', 'adoptDate', 'createdAt', 'updatedAt'].forEach(key => {
    if (result[key] instanceof Date) {
      result[key] = result[key].toISOString();
    }
  });
  return result;
}

Page({
  data: {
    pets: [],
    currentPetId: '',
    currentPet: null,
    upcomingReminders: [],
    familyMembers: [],
    canEdit: true,
    isCreator: false,
    currentPetRole: '',
    loaded: false,
    statusBarHeight: 20,
    userReady: false
  },

  onLoad(options) {
    // 检查是否需要等待用户信息
    var app = getApp();
    if (!app.globalData.userReady) {
      this.setData({ userReady: false });
      wx.redirectTo({
        url: '/pages/loading/loading'
      });
      return;
    }

    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight || 20
      });
    } catch (err) {
      console.error('读取状态栏高度失败：', err);
      this.setData({ statusBarHeight: 20 });
    }
  },

  onShow() {
    var app = getApp();

    // 检查用户信息是否就绪
    if (!app.globalData.userReady) {
      this.setData({ userReady: false });
      wx.redirectTo({
        url: '/pages/loading/loading'
      });
      return;
    }

    this.setData({ userReady: true });

    // 无宠物时（欢迎页）不显示底部导航栏
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      if (this.data.pets && this.data.pets.length > 0) {
        this.getTabBar().setData({ selected: 0 });
      } else {
        this.getTabBar().setData({ selected: '' });
      }
    }

    this.loadData();
  },

  // 加载所有数据
  async loadData() {
    try {
      var app = getApp();
      var openid = app.globalData.openid;

      // 检查登录状态
      if (!openid) {
        this.setData({ loaded: true });
        return;
      }

      // 通过云函数获取所有关联宠物（含角色信息）
      var listRes = await wx.cloud.callFunction({
        name: 'petManage',
        data: { action: 'list' }
      });
      var allPets = (listRes.result && listRes.result.code === 0) ? listRes.result.data : [];

      // 构建 roleMap
      var memberRoleMap = {};
      for (var ri = 0; ri < allPets.length; ri++) {
        memberRoleMap[allPets[ri]._id] = allPets[ri].role || 'member';
      }

      // 确定当前选中的宠物
      var currentPetId = app.globalData.currentPetId;
      var found = false;
      for (var fi = 0; fi < allPets.length; fi++) {
        if (allPets[fi]._id === currentPetId) { found = true; break; }
      }
      if (!currentPetId || !found) {
        currentPetId = allPets.length > 0 ? allPets[0]._id : '';
        app.globalData.currentPetId = currentPetId;
      }

      var currentPet = allPets.length > 0 ? allPets[0] : null;
      for (var ci = 0; ci < allPets.length; ci++) {
        if (allPets[ci]._id === currentPetId) { currentPet = allPets[ci]; break; }
      }

      // 设置当前宠物角色
      var currentRole = memberRoleMap[currentPetId] || 'member';
      app.globalData.currentPetRole = currentRole;
      var canEdit = currentRole === 'creator' || currentRole === 'admin';
      var isCreator = currentRole === 'creator';

      this.setData({
        pets: allPets,
        currentPetId: currentPetId,
        currentPet: currentPet ? serializePet(currentPet) : null,
        canEdit: canEdit,
        isCreator: isCreator,
        currentPetRole: currentRole,
        loaded: true
      });

      // 更新底部导航栏状态
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({ selected: 0 });
      }

      // 保存 roleMap 供切换宠物使用
      this._memberRoleMap = memberRoleMap;

      // 加载近期提醒和家庭成员
      if (currentPetId) {
        this.loadReminders(currentPetId);
        this.loadFamilyMembers(currentPetId);
      }
    } catch (err) {
      console.error('加载首页数据失败：', err);
      this.setData({ loaded: true });
    }
  },

  // 为已有宠物自动补建 creator 成员记录
  async ensureCreatorMember(petId, app) {
    try {
      var userInfo = app.globalData.userInfo || {};
      await wx.cloud.callFunction({
        name: 'familyManage',
        data: {
          action: 'join',
          data: { petId: petId }
        }
      });
      // join 会创建 member 角色，但这里需要是 creator
      // 直接通过数据库更新（客户端只改自己的记录）
      var db = wx.cloud.database();
      var res = await db.collection('pet_members')
        .where({ petId: petId, _openid: app.globalData.openid })
        .limit(1)
        .get();
      if (res.data.length > 0) {
        await db.collection('pet_members').doc(res.data[0]._id).update({
          data: { role: 'creator', nickName: userInfo.nickName || '未知游客', avatarUrl: userInfo.avatarUrl || '' }
        });
      }
    } catch (e) {
      console.error('补建 creator 成员失败', e);
    }
  },

  // 加载近期提醒（来自 records 表中有 nextDate 的记录）
  async loadReminders(petId) {
    try {
      // 通过云函数获取记录数据
      const res = await wx.cloud.callFunction({
        name: 'recordManage',
        data: { action: 'list', data: { petId, limit: 50 } }
      });

      const records = (res.result && res.result.code === 0) ? res.result.data : [];

      const now = new Date();

      // 筛选有提醒且未过期的记录
      const reminders = records
        .filter(r => r.enableRemind && r.nextDate && new Date(r.nextDate) >= now)
        .sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate))
        .slice(0, 3);

      // 格式化提醒数据
      const upcomingReminders = reminders.map(r => {
        const typeInfo = RECORD_TYPE_MAP[r.type] || {};
        const daysLeft = daysBetween(now, r.nextDate);
        const tagClassMap = {
          deworm: 'tag-success',
          checkup: 'tag-info',
          vaccine: 'tag-warning',
          bath: 'tag-purple'
        };

        return {
          ...r,
          typeLabel: typeInfo.label || r.type,
          typeColor: typeInfo.color || '#999',
          tagClass: tagClassMap[r.type] || 'tag-primary',
          nextDateStr: formatDate(r.nextDate, 'MM-DD'),
          daysLeft
        };
      });

      this.setData({ upcomingReminders });
    } catch (err) {
      console.error('加载提醒失败：', err);
    }
  },

  // 切换宠物
  async onSwitchPet(e) {
    var petId = e.detail.petId;
    var app = getApp();

    this.setData({ currentPetId: petId });
    app.globalData.currentPetId = petId;

    var currentPet = null;
    var pets = this.data.pets;
    for (var i = 0; i < pets.length; i++) {
      if (pets[i]._id === petId) { currentPet = pets[i]; break; }
    }
    this.setData({ currentPet: serializePet(currentPet) });

    // 更新角色
    var roleMap = this._memberRoleMap || {};
    var currentRole = roleMap[petId] || 'member';
    app.globalData.currentPetRole = currentRole;
    this.setData({
      canEdit: currentRole === 'creator' || currentRole === 'admin',
      isCreator: currentRole === 'creator',
      currentPetRole: currentRole
    });

    // 更新数据库中的 currentPetId
    app.switchPet(petId);

    // 刷新提醒和家庭成员
    this.loadReminders(petId);
    this.loadFamilyMembers(petId);
  },

  // 编辑宠物
  onEditPet(e) {
    const { petId } = e.detail;
    wx.navigateTo({
      url: `/pages/pet-edit/pet-edit?mode=edit&id=${petId}`
    });
  },

  // 添加宠物 / 跳转添加页面
  goAddPet() {
    var app = getApp();

    // 未登录时提示登录或跳过
    if (!app.globalData.openid) {
      wx.showModal({
        title: '提示',
        content: '登录后可同步数据至云端，是否登录？',
        confirmText: '登录',
        cancelText: '跳过',
        success: function (res) {
          if (res.confirm) {
            // 点击登录，重新初始化用户
            app.initUser().then(function () {
              wx.navigateTo({
                url: '/pages/pet-edit/pet-edit?mode=add'
              });
            });
          } else if (res.cancel) {
            // 点击跳过，直接跳转添加页面（本地模式）
            wx.navigateTo({
              url: '/pages/pet-edit/pet-edit?mode=add'
            });
          }
        }
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/pet-edit/pet-edit?mode=add'
    });
  },

  // 快捷入口 - 清单
  goChecklist() {
    wx.switchTab({ url: '/pages/checklist/checklist' });
  },

  // 快捷入口 - 记录
  goRecord() {
    wx.switchTab({ url: '/pages/record/record' });
  },

  // 快捷入口 - 账单
  goBill() {
    wx.switchTab({ url: '/pages/bill/bill' });
  },

  // 快捷入口 - 体重记录（跳转编辑当前宠物）
  goEditWeight() {
    if (this.data.currentPetId) {
      wx.navigateTo({
        url: '/pages/pet-edit/pet-edit?mode=edit&id=' + this.data.currentPetId
      });
    }
  },

  // 快捷入口 - 地图
  goMap() {
    wx.navigateTo({ url: '/pages/map/map' });
  },

  // 指南 - 养狗指南（跳转公众号合集）
  goDogGuide() {
    wx.navigateTo({
      url: '/pages/webview/webview?url=' + encodeURIComponent('https://mp.weixin.qq.com/s?__biz=MzI1NDQ3NTUxMA==&mid=2247484409&idx=1&sn=02d7ba44d6c929cc092cac36d40c7d8b&chksm=e9c5ee60deb267765f88441120a51e4523d0d1551033cb3a452148fdf37737bea8c716799dea&scene=178&cur_album_id=4456222019121938438')
    });
  },

  // 加载家庭成员
  async loadFamilyMembers(petId) {
    var app = getApp();
    if (!app.globalData.openid) return;

    try {
      var res = await wx.cloud.callFunction({
        name: 'familyManage',
        data: { action: 'list', data: { petId: petId } }
      });
      console.log('loadFamilyMembers 云函数返回:', JSON.stringify(res.result));
      var members = res.result.data || [];
      var roleLabels = { creator: '创建者', admin: '管理员', member: '成员' };
      for (var i = 0; i < members.length; i++) {
        members[i].roleLabel = roleLabels[members[i].role] || '成员';
        members[i].avatarUrl = members[i].avatarUrl || '';
      }
      console.log('loadFamilyMembers setData 前:', members);
      this.setData({ familyMembers: members });
    } catch (err) {
      console.error('加载家庭成员失败', err);
    }
  },

  // 分享小程序（邀请成员）- 跳转到邀请页面
  onShareAppMessage: function (options) {
    var pet = this.data.currentPet;
    var petName = pet ? pet.name : '宠物';
    
    // 有宠物时，邀请成员
    if (pet && options.from === 'button') {
      // 来自页面内转发按钮（邀请成员按钮）
      return {
        title: '邀请你加入「' + petName + '」的照顾家庭',
        path: '/pages/invite/invite?id=' + this.data.currentPetId,
        imageUrl: pet.avatar || ''
      };
    } else {
      // 没有宠物时，分享首页
      // 来自右上角菜单，分享首页
      return {
        title: 'PawDiary - 记录宠物生活的每一天',
        path: '/pages/home/home',
        imageUrl: '/images/guide/illust-main.png'
      };
    }
  },

  // 长按成员弹出管理菜单（创建者）
  onMemberLongPress: function(e) {
    if (!this.data.isCreator) return;
    var openid = e.currentTarget.dataset.openid;
    var role = e.currentTarget.dataset.role;
    if (role === 'creator') return;

    var items = [role === 'admin' ? '取消管理员' : '设为管理员', '移除成员'];
    var that = this;
    wx.showActionSheet({
      itemList: items,
      success: function(res) {
        if (res.tapIndex === 0) {
          that.toggleMemberRole(openid, role);
        } else if (res.tapIndex === 1) {
          that.removeMember(openid);
        }
      }
    });
  },

  // 切换成员角色（创建者操作）
  async toggleMemberRole(targetOpenid, currentRole) {
    var app = getApp();
    if (!app.globalData.openid) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    var newRole = currentRole === 'admin' ? 'member' : 'admin';
    var label = newRole === 'admin' ? '设为管理员' : '取消管理员';

    try {
      var confirmRes = await wx.showModal({
        title: '确认操作',
        content: '确定要' + label + '吗？'
      });
      if (!confirmRes.confirm) return;

      await wx.cloud.callFunction({
        name: 'familyManage',
        data: { action: 'updateRole', data: { petId: this.data.currentPetId, targetOpenid: targetOpenid, role: newRole } }
      });
      wx.showToast({ title: '已更新', icon: 'success' });
      this.loadFamilyMembers(this.data.currentPetId);
    } catch (err) {
      console.error('更新角色失败', err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 移除成员（创建者操作）
  async removeMember(targetOpenid) {
    var app = getApp();
    if (!app.globalData.openid) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    try {
      var confirmRes = await wx.showModal({
        title: '确认移除',
        content: '确定要移除该成员吗？移除后对方将无法查看该宠物数据。',
        confirmColor: '#C0392B'
      });
      if (!confirmRes.confirm) return;

      await wx.cloud.callFunction({
        name: 'familyManage',
        data: { action: 'remove', data: { petId: this.data.currentPetId, targetOpenid: targetOpenid } }
      });
      wx.showToast({ title: '已移除', icon: 'success' });
      this.loadFamilyMembers(this.data.currentPetId);
    } catch (err) {
      console.error('移除成员失败', err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 头像加载失败处理
  onAvatarError(e) {
    var openid = e.currentTarget.dataset.openid;
    var members = this.data.familyMembers;
    var updated = false;

    console.log('头像加载失败 openid:', openid, 'error:', e.detail);

    for (var i = 0; i < members.length; i++) {
      if (members[i]._openid === openid) {
        // 将该成员的头像 URL 设置为空字符串，触发重新渲染为默认头像
        members[i].avatarUrl = '';
        updated = true;
        break;
      }
    }

    if (updated) {
      this.setData({ familyMembers: members });
    }
  }
});