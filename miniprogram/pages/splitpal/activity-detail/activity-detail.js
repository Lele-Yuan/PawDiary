const { SPLIT_CATEGORIES, SPLIT_CATEGORY_MAP } = require('../../../utils/constants');

function fen2yuan(fen) {
  return ((fen || 0) / 100).toFixed(2);
}
// 元字符串转分（整数）
function yuan2fen(str) {
  const n = parseFloat(str);
  if (isNaN(n)) return 0;
  return Math.round(n * 100);
}
// 由 openid 数组构建选中映射 { openid: true }
function buildPartMap(ids) {
  const map = {};
  (ids || []).forEach(id => { map[id] = true; });
  return map;
}

Page({
  data: {
    activityId: '',
    inviteCode: '',
    navTitleOpacity: 1,
    activity: null,
    members: [],
    memberMap: {},
    myRole: 'member',
    myOpenid: '',
    currentTab: 'bills',
    categories: SPLIT_CATEGORIES,
    catMap: SPLIT_CATEGORY_MAP,

    // 登录（邀请加入场景）
    userInfo: {},
    showLoginModal: false,
    pendingJoin: false,
    needLogin: false,

    // 账单
    groupedBills: [],

    // 结算
    settlements: [],
    settleProgress: { paid: 0, total: 0, percent: 0 },
    allSettled: false,
    myBalance: { paid: '0.00', owe: '0.00', net: '0.00', netPositive: true },

    // 统计
    stats: null,

    // 记一笔弹层
    showBillSheet: false,
    editingBillId: '',
    billForm: {
      category: 'food',
      amountStr: '',
      title: '',
      payerId: '',
      isAA: true,
      participants: [],
      splitStrs: {}
    },

    // 邀请弹层
    showInvite: false
  },

  onLoad(options) {
    const app = getApp();
    const id = options.id || options.activityId;
    const inviteCode = options.inviteCode || '';
    if (!id) {
      wx.showToast({ title: '缺少活动ID', icon: 'none' });
      return;
    }
    this.setData({ activityId: id, inviteCode });

    const ready = app.waitForUserReady ? app.waitForUserReady() : Promise.resolve();
    ready.then(() => {
      const gi = app.globalData.userInfo || {};
      const isGuest = !gi.nickName || gi.nickName === '未知游客';
      this.setData({ myOpenid: app.globalData.openid || '', userInfo: gi });

      if (inviteCode && isGuest) {
        // 邀请进入且未登录：先弹通用登录弹窗，登录成功后再加入
        this.setData({ pendingJoin: true, needLogin: true, showLoginModal: true });
      } else if (inviteCode) {
        this.joinAndLoad();
      } else {
        this.loadActivity();
      }
    });
  },

  // 通过邀请码加入并加载活动
  joinAndLoad() {
    wx.showLoading({ title: '加入中...', mask: true });
    wx.cloud.callFunction({
      name: 'splitManage',
      data: { action: 'joinActivity', data: { activityId: this.data.activityId, inviteCode: this.data.inviteCode } }
    }).then(res => {
      wx.hideLoading();
      const r = res.result || {};
      if (r.code !== 0) wx.showToast({ title: r.message || '加入失败', icon: 'none' });
      this.setData({ pendingJoin: false });
      this.loadActivity();
    }).catch(() => { wx.hideLoading(); this.loadActivity(); });
  },

  // 登录成功回调
  onLoginSuccess(e) {
    const { avatarUrl, nickName, phone } = e.detail || {};
    const app = getApp();
    const userInfo = { ...app.globalData.userInfo, avatarUrl, nickName, phone };
    app.globalData.userInfo = userInfo;
    // 标记本次关闭是登录成功触发（login-modal 会先 success 再 close）
    this._loginSucceeded = true;
    this.setData({
      userInfo,
      showLoginModal: false,
      needLogin: false,
      myOpenid: app.globalData.openid || this.data.myOpenid
    });
    if (this.data.pendingJoin) this.joinAndLoad();
    else this.loadActivity();
  },

  // 关闭登录弹窗
  onLoginClose() {
    this.setData({ showLoginModal: false });
    // 登录成功触发的关闭不提示
    if (this._loginSucceeded) {
      this._loginSucceeded = false;
      return;
    }
    if (this.data.pendingJoin) {
      wx.showToast({ title: '登录后才能加入活动', icon: 'none' });
    }
  },

  // 重新打开登录弹窗（阻断态按钮）
  reopenLogin() {
    this.setData({ showLoginModal: true });
  },

  onShow() {
    if (this.data.activity) this.refreshCurrentTab();
  },

  onPageScroll(e) {
    const opacity = Math.max(0, 1 - e.scrollTop / 150);
    if (Math.abs(opacity - this.data.navTitleOpacity) > 0.05 || opacity === 0 || opacity === 1) {
      this.setData({ navTitleOpacity: Math.round(opacity * 100) / 100 });
    }
  },

  loadActivity() {
    wx.cloud.callFunction({
      name: 'splitManage',
      data: { action: 'getActivity', data: { _id: this.data.activityId } }
    }).then(res => {
      const r = res.result || {};
      if (r.code !== 0) {
        wx.showToast({ title: r.message || '加载失败', icon: 'none' });
        return;
      }
      const memberMap = {};
      r.data.members.forEach(m => { memberMap[m.openid] = m; });
      const membersDecorated = r.data.members.map(m => ({
        ...m,
        initial: (m.nickName || '?').charAt(0)
      }));
      this.setData({
        activity: r.data.activity,
        members: membersDecorated,
        memberMap,
        myRole: r.data.myRole
      });
      this.refreshCurrentTab();
    }).catch(() => wx.showToast({ title: '网络异常', icon: 'none' }));
  },

  refreshCurrentTab() {
    const t = this.data.currentTab;
    if (t === 'bills') this.loadBills();
    else if (t === 'settle') this.loadSettlements();
    else if (t === 'stats') this.loadStats();
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
    this.refreshCurrentTab();
  },

  // ===== 账单 Tab =====
  loadBills() {
    wx.cloud.callFunction({
      name: 'splitManage',
      data: { action: 'listBills', data: { activityId: this.data.activityId } }
    }).then(res => {
      const r = res.result || {};
      if (r.code === 0) this.setData({ groupedBills: this.groupBills(r.data) });
    });
  },

  groupBills(bills) {
    const map = {};
    const order = [];
    (bills || []).forEach(b => {
      const d = new Date(b.billDate);
      const key = `${d.getMonth() + 1}月${d.getDate()}日`;
      if (!map[key]) { map[key] = []; order.push(key); }
      const cat = this.data.catMap[b.category] || { icon: '📦', label: '其他' };
      const perStr = b.isAA && b.participants.length
        ? `人均¥${fen2yuan(Math.floor(b.amount / b.participants.length))}`
        : '';
      map[key].push({
        ...b,
        amountStr: fen2yuan(b.amount),
        catIcon: cat.icon,
        catLabel: cat.label,
        payerName: (this.data.memberMap[b.payerId] || {}).nickName || b.payerName,
        splitDesc: b.isAA ? `${b.participants.length}人均摊` : '自定义分摊',
        perStr
      });
    });
    return order.map(date => ({ date, items: map[date] }));
  },

  // ===== 结算 Tab =====
  // 进入结算：先拉取已有结算记录；若尚未生成过则自动生成一次
  loadSettlements() {
    wx.showLoading({ title: '加载中...', mask: true });
    this.fetchSettlements()
      .then(total => {
        if (total === 0) return this.doCalc().then(() => this.fetchSettlements());
      })
      .then(() => { wx.hideLoading(); this.computeMyBalance(); })
      .catch(() => wx.hideLoading());
  },

  // 仅拉取结算清单（不重新计算，避免重置已标记的还款状态）
  fetchSettlements() {
    return wx.cloud.callFunction({
      name: 'splitManage',
      data: { action: 'listSettlements', data: { activityId: this.data.activityId } }
    }).then(res => {
      const r = res.result || {};
      if (r.code !== 0) return 0;
      const list = (r.data.settlements || []).map(s => ({
        ...s,
        amountStr: fen2yuan(s.amount),
        fromName: (this.data.memberMap[s.fromOpenid] || {}).nickName || '成员',
        toName: (this.data.memberMap[s.toOpenid] || {}).nickName || '成员'
      }));
      const total = r.data.total;
      const paid = r.data.paid;
      this.setData({
        settlements: list,
        settleProgress: { paid, total, percent: total ? Math.round(paid / total * 100) : 0 },
        allSettled: total > 0 && paid === total
      });
      return total;
    });
  },

  // 重新计算结算清单（会重置还款状态）
  doCalc() {
    return wx.cloud.callFunction({
      name: 'splitManage',
      data: { action: 'calcSettlement', data: { activityId: this.data.activityId } }
    });
  },

  // 手动重新结算入口
  recalcSettlement() {
    wx.showModal({
      title: '重新结算',
      content: '将根据最新账单重新生成转账清单，已标记的还款状态会被重置。确定继续？',
      success: (m) => {
        if (!m.confirm) return;
        wx.showLoading({ title: '结算中...', mask: true });
        this.doCalc()
          .then(() => this.fetchSettlements())
          .then(() => { wx.hideLoading(); this.computeMyBalance(); })
          .catch(() => wx.hideLoading());
      }
    });
  },

  computeMyBalance() {
    // 基于账单计算我的支付与应承担
    wx.cloud.callFunction({
      name: 'splitManage',
      data: { action: 'listBills', data: { activityId: this.data.activityId } }
    }).then(res => {
      const r = res.result || {};
      if (r.code !== 0) return;
      const me = this.data.myOpenid;
      let paid = 0, owe = 0;
      (r.data || []).forEach(b => {
        if (b.payerId === me) paid += b.amount;
        (b.splits || []).forEach(s => { if (s.memberId === me) owe += s.amount; });
      });
      const net = paid - owe;
      this.setData({
        myBalance: {
          paid: fen2yuan(paid),
          owe: fen2yuan(owe),
          net: fen2yuan(Math.abs(net)),
          netPositive: net >= 0
        }
      });
    });
  },

  onMarkPaid(e) {
    const item = e.currentTarget.dataset.item;
    const nextStatus = item.status === 'paid' ? 'pending' : 'paid';
    wx.cloud.callFunction({
      name: 'splitManage',
      data: { action: 'markPaid', data: { _id: item._id, status: nextStatus } }
    }).then(res => {
      const r = res.result || {};
      if (r.code === 0) {
        this.fetchSettlements().then(() => this.computeMyBalance());
        if (r.data && r.data.allSettled) {
          wx.showToast({ title: '全部结清 🎉', icon: 'none' });
          this.loadActivity();
        }
      } else {
        wx.showToast({ title: r.message || '操作失败', icon: 'none' });
      }
    });
  },

  // ===== 统计 Tab =====
  loadStats() {
    wx.cloud.callFunction({
      name: 'splitManage',
      data: { action: 'getStats', data: { activityId: this.data.activityId } }
    }).then(res => {
      const r = res.result || {};
      if (r.code !== 0) return;
      const d = r.data;
      const maxCat = Math.max(1, ...d.categoryStats.map(c => c.amount));
      const maxOwe = Math.max(1, ...d.memberStats.map(m => m.owe));
      this.setData({
        stats: {
          totalStr: fen2yuan(d.total),
          avgStr: fen2yuan(d.avg),
          billCount: d.billCount,
          categoryStats: d.categoryStats.map(c => ({
            ...c,
            label: (this.data.catMap[c.category] || { label: '其他' }).label,
            icon: (this.data.catMap[c.category] || { icon: '📦' }).icon,
            amountStr: fen2yuan(c.amount),
            barWidth: Math.round(c.amount / maxCat * 100)
          })),
          memberStats: d.memberStats.map(m => ({
            ...m,
            oweStr: fen2yuan(m.owe),
            barWidth: Math.round(m.owe / maxOwe * 100)
          }))
        }
      });
    });
  },

  // ===== 记一笔弹层 =====
  openBillSheet() {
    const allIds = this.data.members.map(m => m.openid);
    const defaultPayer = this.data.myOpenid || (this.data.members[0] && this.data.members[0].openid) || '';
    this.setData({
      showBillSheet: true,
      editingBillId: '',
      billForm: {
        category: 'food',
        amountStr: '',
        title: '',
        payerId: defaultPayer,
        isAA: true,
        participants: allIds,
        partMap: buildPartMap(allIds),
        splitStrs: {}
      }
    });
  },

  editBill(e) {
    const bill = e.currentTarget.dataset.bill;
    const splitStrs = {};
    (bill.splits || []).forEach(s => { splitStrs[s.memberId] = fen2yuan(s.amount); });
    this.setData({
      showBillSheet: true,
      editingBillId: bill._id,
      billForm: {
        category: bill.category,
        amountStr: fen2yuan(bill.amount),
        title: bill.title,
        payerId: bill.payerId,
        isAA: bill.isAA,
        participants: bill.participants.slice(),
        partMap: buildPartMap(bill.participants),
        splitStrs
      }
    });
  },

  closeBillSheet() {
    this.setData({ showBillSheet: false });
  },

  noop() {},

  selectCategory(e) {
    this.setData({ 'billForm.category': e.currentTarget.dataset.key });
  },
  inputAmount(e) {
    this.setData({ 'billForm.amountStr': e.detail.value });
  },
  inputTitle(e) {
    this.setData({ 'billForm.title': e.detail.value });
  },
  selectPayer(e) {
    this.setData({ 'billForm.payerId': e.currentTarget.dataset.openid });
  },
  toggleAA(e) {
    this.setData({ 'billForm.isAA': e.detail.value });
  },
  toggleParticipant(e) {
    const openid = e.currentTarget.dataset.openid;
    const list = this.data.billForm.participants.slice();
    const idx = list.indexOf(openid);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(openid);
    this.setData({
      'billForm.participants': list,
      'billForm.partMap': buildPartMap(list)
    });
  },
  inputSplit(e) {
    const openid = e.currentTarget.dataset.openid;
    this.setData({ [`billForm.splitStrs.${openid}`]: e.detail.value });
  },

  submitBill() {
    const f = this.data.billForm;
    const amount = yuan2fen(f.amountStr);
    if (amount <= 0) { wx.showToast({ title: '请输入正确金额', icon: 'none' }); return; }
    if (!f.title.trim()) { wx.showToast({ title: '请输入明细描述', icon: 'none' }); return; }
    if (!f.participants.length) { wx.showToast({ title: '请选择参与成员', icon: 'none' }); return; }

    const payer = this.data.memberMap[f.payerId] || {};
    const data = {
      activityId: this.data.activityId,
      category: f.category,
      title: f.title.trim(),
      amount,
      payerId: f.payerId,
      payerName: payer.nickName || '',
      isAA: f.isAA,
      participants: f.participants
    };
    if (!f.isAA) {
      const splits = f.participants.map(id => ({ memberId: id, amount: yuan2fen(f.splitStrs[id]) }));
      const sum = splits.reduce((s, x) => s + x.amount, 0);
      if (sum !== amount) {
        wx.showToast({ title: `分摊合计¥${fen2yuan(sum)}≠账单¥${fen2yuan(amount)}`, icon: 'none' });
        return;
      }
      data.splits = splits;
    }
    if (this.data.editingBillId) data._id = this.data.editingBillId;

    wx.showLoading({ title: '保存中...', mask: true });
    const action = this.data.editingBillId ? 'updateBill' : 'addBill';
    wx.cloud.callFunction({ name: 'splitManage', data: { action, data } })
      .then(res => {
        wx.hideLoading();
        const r = res.result || {};
        if (r.code === 0) {
          this.setData({ showBillSheet: false });
          wx.showToast({ title: '已保存', icon: 'success' });
          this.loadActivity();
          this.loadBills();
        } else if (r.code === -1001) {
          wx.showToast({ title: '内容包含违规信息', icon: 'none' });
        } else {
          wx.showToast({ title: r.message || '保存失败', icon: 'none' });
        }
      })
      .catch(() => { wx.hideLoading(); wx.showToast({ title: '网络异常', icon: 'none' }); });
  },

  onDeleteBill(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除账单',
      content: '确定删除这笔账单吗？',
      confirmColor: '#FA5151',
      success: (m) => {
        if (!m.confirm) return;
        wx.cloud.callFunction({
          name: 'splitManage',
          data: { action: 'deleteBill', data: { _id: id } }
        }).then(res => {
          const r = res.result || {};
          if (r.code === 0) {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadActivity();
            this.loadBills();
          } else {
            wx.showToast({ title: r.message || '删除失败', icon: 'none' });
          }
        });
      }
    });
  },

  // ===== 邀请 & 分享 =====
  openInvite() { this.setData({ showInvite: true }); },
  closeInvite() { this.setData({ showInvite: false }); },

  copyInvite() {
    const a = this.data.activity;
    wx.setClipboardData({
      data: `我发起了「${a.name}」分账，邀请码：${a.inviteCode}`,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    });
  },

  goEditActivity() {
    const a = this.data.activity;
    wx.navigateTo({
      url: `/pages/splitpal/activity-edit/activity-edit?id=${a._id}&name=${encodeURIComponent(a.name)}&emoji=${encodeURIComponent(a.coverEmoji)}`
    });
  },

  onShareAppMessage() {
    const a = this.data.activity || {};
    console.log('share Page', `/pages/splitpal/activity-detail/activity-detail?id=${this.data.activityId}&inviteCode=${a.inviteCode || ''}`);
    return {
      title: `邀请你加入「${a.name || '分账'}」一起记账分摊`,
      path: `/pages/splitpal/activity-detail/activity-detail?id=${this.data.activityId}&inviteCode=${a.inviteCode || ''}`
    };
  }
});
