// pages/mealtime/utils/api.js —— 统一调用 mealManage 云函数（动作按域命名空间）
function call(action, data = {}) {
  wx.showLoading({ title: '加载中', mask: true });
  return wx.cloud.callFunction({ name: 'mealManage', data: { action, ...data } })
    .then(res => {
      wx.hideLoading();
      const r = res.result || {};
      if (r.code !== 0) {
        wx.showToast({ title: r.msg || '操作失败', icon: 'none' });
        return Promise.reject(r);
      }
      return r.data;
    })
    .catch(err => {
      wx.hideLoading();
      if (err && err.code !== undefined) return Promise.reject(err);
      wx.showToast({ title: '网络异常', icon: 'none' });
      return Promise.reject(err);
    });
}

// 静默调用（不弹加载/错误提示），用于资料同步等后台操作
function silent(action, data = {}) {
  return wx.cloud.callFunction({ name: 'mealManage', data: { action, ...data } })
    .then(res => (res.result && res.result.data) || null)
    .catch(() => null);
}

module.exports = {
  // 饭局相关
  family: {
    myList: () => call('family.myList'),
    create: (name) => call('family.create', { name }),
    detail: (familyId) => call('family.detail', { familyId }),
    join: (inviteCode) => call('family.join', { inviteCode }),
    approve: (familyId, membershipId, pass) => call('family.approve', { familyId, membershipId, pass }),
    removeMember: (familyId, membershipId) => call('family.removeMember', { familyId, membershipId }),
    setAdmin: (familyId, membershipId, isAdmin) => call('family.setAdmin', { familyId, membershipId, isAdmin }),
    switchRole: (familyId, kitchenRole) => call('family.switchRole', { familyId, kitchenRole }),
    leave: (familyId) => call('family.leave', { familyId }),
    dissolve: (familyId) => call('family.dissolve', { familyId }),
    refreshCode: (familyId) => call('family.refreshCode', { familyId }),
    updateInfo: (familyId, name, needApproval) => call('family.updateInfo', { familyId, name, needApproval })
  },
  // 菜品相关
  dish: {
    myList: () => call('dish.myList'),
    save: (dish) => call('dish.save', { dish }),
    remove: (dishId) => call('dish.remove', { dishId }),
    poolList: (familyId) => call('dish.poolList', { familyId })
  },
  // 约饭 / 点菜 / 小票
  meal: {
    current: (familyId) => call('meal.current', { familyId }),
    start: (familyId) => call('meal.start', { familyId }),
    pick: (mealId, dishId) => call('meal.pick', { mealId, dishId }),
    unpick: (mealId, dishId) => call('meal.unpick', { mealId, dishId }),
    submit: (mealId) => call('meal.submit', { mealId }),
    finish: (mealId) => call('meal.finish', { mealId }),
    receipt: (mealId) => call('meal.receipt', { mealId }),
    history: (familyId) => call('meal.history', { familyId })
  },
  // 基础数据（食材库 / 口味库）
  base: {
    ingredients: () => call('dish.ingredients'),
    tastes: () => call('dish.tastes')
  },
  // 用户资料同步（静默）
  user: {
    syncProfile: (profile) => silent('user.syncProfile', profile || {})
  }
};
