const { daysBetween, formatDate } = require('../../utils/util');
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
    statusBarHeight: 20
  },

  onLoad() {
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
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    this.loadData();
    this.checkPendingInvite();
  },

  // 加载所有数据
  async loadData() {
    try {
      var app = getApp();
      var db = wx.cloud.database();
      var _cmd = db.command;
      var openid = app.globalData.openid;

      // 1. 自己创建的宠物
      var ownRes = await db.collection('pets')
        .where({ status: 'active' })
        .orderBy('createdAt', 'asc')
        .get();
      var ownPets = ownRes.data;

      // 2. 查询 pet_members 获取加入的宠物
      var memberRoleMap = {};
      var sharedPetIds = [];
      if (openid) {
        var memberRes = await db.collection('pet_members')
          .where({ _openid: openid })
          .get();
        for (var i = 0; i < memberRes.data.length; i++) {
          var m = memberRes.data[i];
          memberRoleMap[m.petId] = m.role;
          sharedPetIds.push(m.petId);
        }
      }

      // 标记自己创建的宠物为 creator（如果没有 pet_members 记录则自动补建）
      for (var j = 0; j < ownPets.length; j++) {
        var ownPetId = ownPets[j]._id;
        if (!memberRoleMap[ownPetId]) {
          memberRoleMap[ownPetId] = 'creator';
          // 自动补建 creator 记录
          this.ensureCreatorMember(ownPetId, app);
        }
      }

      // 3. 查询被邀请加入但不属于自己创建的宠物
      var ownIdSet = {};
      for (var oi = 0; oi < ownPets.length; oi++) {
        ownIdSet[ownPets[oi]._id] = true;
      }
      var extraIds = [];
      for (var k = 0; k < sharedPetIds.length; k++) {
        if (!ownIdSet[sharedPetIds[k]]) {
          extraIds.push(sharedPetIds[k]);
        }
      }

      var sharedPets = [];
      if (extraIds.length > 0) {
        var spRes = await db.collection('pets')
          .where({ _id: _cmd.in(extraIds), status: 'active' })
          .get();
        sharedPets = spRes.data;
      }

      var allPets = ownPets.concat(sharedPets);

      if (allPets.length === 0) {
        this.setData({ pets: [], currentPet: null, loaded: true });
        app.globalData.currentPetRole = '';
        return;
      }

      // 确定当前选中的宠物
      var currentPetId = app.globalData.currentPetId;
      var found = false;
      for (var fi = 0; fi < allPets.length; fi++) {
        if (allPets[fi]._id === currentPetId) { found = true; break; }
      }
      if (!currentPetId || !found) {
        currentPetId = allPets[0]._id;
        app.globalData.currentPetId = currentPetId;
      }

      var currentPet = allPets[0];
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
        currentPet: serializePet(currentPet),
        canEdit: canEdit,
        isCreator: isCreator,
        currentPetRole: currentRole,
        loaded: true
      });

      // 保存 roleMap 供切换宠物使用
      this._memberRoleMap = memberRoleMap;

      // 加载近期提醒和家庭成员
      this.loadReminders(currentPetId);
      this.loadFamilyMembers(currentPetId);
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
          data: { role: 'creator', nickName: userInfo.nickName || '宠物主人', avatarUrl: userInfo.avatarUrl || '' }
        });
      }
    } catch (e) {
      console.error('补建 creator 成员失败', e);
    }
  },

  // 加载近期提醒（来自 records 表中有 nextDate 的记录）
  async loadReminders(petId) {
    try {
      const db = wx.cloud.database();
      const _ = db.command;
      const now = new Date();

      const { data: reminders } = await db.collection('records')
        .where({
          petId,
          nextDate: _.gte(now)
        })
        .orderBy('nextDate', 'asc')
        .limit(3)
        .get();

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

  // 添加宠物
  goAddPet() {
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

  // 加载家庭成员
  async loadFamilyMembers(petId) {
    try {
      var res = await wx.cloud.callFunction({
        name: 'familyManage',
        data: { action: 'list', data: { petId: petId } }
      });
      var members = res.result.data || [];
      var roleLabels = { creator: '创建者', admin: '管理员', member: '成员' };
      for (var i = 0; i < members.length; i++) {
        members[i].roleLabel = roleLabels[members[i].role] || '成员';
      }
      this.setData({ familyMembers: members });
    } catch (err) {
      console.error('加载家庭成员失败', err);
    }
  },

  // 分享小程序（邀请成员）
  onShareAppMessage: function () {
    var pet = this.data.currentPet;
    var petName = pet ? pet.name : '宠物';
    return {
      title: '邀请你加入「' + petName + '」的照顾家庭',
      path: '/pages/home/home?invitePetId=' + this.data.currentPetId,
      imageUrl: (pet && pet.avatar) ? pet.avatar : ''
    };
  },

  // 处理待处理的邀请
  async checkPendingInvite() {
    var app = getApp();
    var invitePetId = app.globalData.pendingInvite;
    if (!invitePetId) return;
    app.globalData.pendingInvite = '';

    // 等待 openid 就绪
    if (!app.globalData.openid) {
      var that = this;
      app.userInfoReadyCallback = function () {
        that.checkPendingInvite();
      };
      app.globalData.pendingInvite = invitePetId;
      return;
    }

    try {
      var db = wx.cloud.database();
      var petRes = await db.collection('pets').doc(invitePetId).get();
      var pet = petRes.data;
      if (!pet || pet.status !== 'active') return;

      var modalRes = await wx.showModal({
        title: '加入宠物家庭',
        content: '你被邀请加入「' + pet.name + '」的照顾家庭，加入后可查看该宠物的所有数据。',
        confirmText: '加入',
        cancelText: '取消'
      });
      if (!modalRes.confirm) return;

      var res = await wx.cloud.callFunction({
        name: 'familyManage',
        data: { action: 'join', data: { petId: invitePetId } }
      });
      if (res.result.code === 0) {
        wx.showToast({ title: res.result.message, icon: 'success' });
        this.loadData();
      } else {
        wx.showToast({ title: res.result.message || '加入失败', icon: 'none' });
      }
    } catch (err) {
      console.error('处理邀请失败', err);
    }
  },

  // 切换成员角色（创建者操作）
  async onToggleRole(e) {
    var targetOpenid = e.currentTarget.dataset.openid;
    var currentRole = e.currentTarget.dataset.role;
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
  async onRemoveMember(e) {
    var targetOpenid = e.currentTarget.dataset.openid;
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
  }
});