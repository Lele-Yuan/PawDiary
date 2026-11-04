// cloudfunctions/mealManage/family.js —— 家庭与成员
module.exports = function (db, _, helpers) {
  const COL_U = 'meal_users', COL_F = 'meal_families', COL_M = 'meal_memberships', COL_MEAL = 'meal_meals';
  const { myMembership } = helpers;

  function genInviteCode() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  async function loadUsers(userIds) {
    if (!userIds.length) return {};
    const r = await db.collection(COL_U).where({ _id: _.in(userIds) }).get();
    const map = {};
    r.data.forEach(u => { map[u._id] = u; });
    return map;
  }

  // 按条件分页批量删除（每批 100）
  async function removeAll(col, where) {
    let n;
    do {
      const r = await db.collection(col).where(where).limit(100).get();
      n = r.data.length;
      for (const d of r.data) await db.collection(col).doc(d._id).remove();
    } while (n === 100);
  }

  async function uniqueCode() {
    let code, exist;
    do {
      code = genInviteCode();
      exist = await db.collection(COL_F).where({ inviteCode: code }).count();
    } while (exist.total > 0);
    return code;
  }

  return {
    // 我加入的家庭列表
    async myList(event, me) {
      const mine = await db.collection(COL_M).where({ userId: me._id, status: 1 }).get();
      const familyIds = mine.data.map(m => m.familyId);
      if (!familyIds.length) return [];
      const myRoleMap = {};
      mine.data.forEach(m => { myRoleMap[m.familyId] = { isAdmin: !!m.isAdmin, kitchenRole: m.kitchenRole || 0 }; });
      const fams = await db.collection(COL_F).where({ _id: _.in(familyIds) }).get();
      const result = [];
      for (const f of fams.data) {
        const members = await db.collection(COL_M).where({ familyId: f._id, status: 1 }).get();
        const cookCount = members.data.filter(m => m.kitchenRole === 1).length;
        const mealR = await db.collection(COL_MEAL).where({ familyId: f._id, status: _.in([0, 1]) }).get();
        const mine2 = myRoleMap[f._id] || { isAdmin: false, kitchenRole: 0 };
        const userMap = await loadUsers(members.data.slice(0, 5).map(m => m.userId));
        const avatars = members.data.slice(0, 5).map(m => {
          const u = userMap[m.userId] || {};
          return { avatarUrl: u.avatarUrl || '', nickName: u.nickName || '匿名' };
        });
        result.push({
          _id: f._id, name: f.name,
          memberCount: members.data.length, cookCount,
          members: avatars,
          isAdmin: mine2.isAdmin, kitchenRole: mine2.kitchenRole,
          mealStatus: mealR.data.length ? mealR.data[0].status : -1
        });
      }
      return result;
    },

    // 创建家庭
    async create(event, me) {
      const name = (event.name || '').trim();
      if (!name) throw { code: 1, msg: '请填写家庭名称' };
      let code, exist;
      do {
        code = genInviteCode();
        exist = await db.collection(COL_F).where({ inviteCode: code }).count();
      } while (exist.total > 0);
      const add = await db.collection(COL_F).add({
        data: { name, founderId: me._id, inviteCode: code, needApproval: true, createdAt: db.serverDate() }
      });
      await db.collection(COL_M).add({
        data: { familyId: add._id, userId: me._id, isAdmin: true, kitchenRole: 0, status: 1, joinedAt: db.serverDate(), createdAt: db.serverDate() }
      });
      return { familyId: add._id, inviteCode: code };
    },
    // 家庭详情：基础信息 + 成员列表 + 待审批 + 我的身份 + 当前约饭
    async detail(event, me) {
      const f = await db.collection(COL_F).doc(event.familyId).get().then(r => r.data).catch(() => null);
      if (!f) throw { code: 404, msg: '家庭不存在' };
      const mine = await myMembership(event.familyId, me._id);
      if (!mine) throw { code: 403, msg: '你不是该家庭成员' };

      const all = await db.collection(COL_M).where({ familyId: event.familyId, status: _.in([0, 1]) }).get();
      const userMap = await loadUsers(all.data.map(m => m.userId));

      const members = [], pending = [];
      all.data.forEach(m => {
        const u = userMap[m.userId] || {};
        const item = {
          membershipId: m._id, userId: m.userId,
          nickName: u.nickName || '匿名', avatarUrl: u.avatarUrl || '',
          isAdmin: m.isAdmin, kitchenRole: m.kitchenRole,
          isFounder: f.founderId === m.userId
        };
        if (m.status === 1) members.push(item); else pending.push(item);
      });

      const mealR = await db.collection(COL_MEAL)
        .where({ familyId: event.familyId, status: _.in([0, 1]) })
        .orderBy('createdAt', 'desc').limit(1).get();

      return {
        family: { _id: f._id, name: f.name, inviteCode: f.inviteCode, needApproval: f.needApproval !== false, isFounder: f.founderId === me._id },
        me: { membershipId: mine._id, isAdmin: mine.isAdmin, kitchenRole: mine.kitchenRole, isFounder: f.founderId === me._id },
        members, pending,
        currentMeal: mealR.data[0] ? { _id: mealR.data[0]._id, status: mealR.data[0].status } : null
      };
    },

    // 加入家庭（凭邀请码）
    async join(event, me) {
      const code = (event.inviteCode || '').trim().toUpperCase();
      const fr = await db.collection(COL_F).where({ inviteCode: code }).get();
      if (!fr.data.length) throw { code: 1, msg: '邀请码无效' };
      const f = fr.data[0];
      const existed = await db.collection(COL_M).where({ familyId: f._id, userId: me._id }).get();
      if (existed.data.length) {
        const m = existed.data[0];
        if (m.status === 1) return { familyId: f._id, status: 1, msg: '你已是成员' };
        if (m.status === 0) return { familyId: f._id, status: 0, msg: '申请已提交，等待审批' };
        await db.collection(COL_M).doc(m._id).update({
          data: { status: f.needApproval ? 0 : 1, kitchenRole: 0, isAdmin: false, joinedAt: f.needApproval ? null : db.serverDate() }
        });
        return { familyId: f._id, status: f.needApproval ? 0 : 1 };
      }
      await db.collection(COL_M).add({
        data: {
          familyId: f._id, userId: me._id, isAdmin: false, kitchenRole: 0,
          status: f.needApproval ? 0 : 1,
          joinedAt: f.needApproval ? null : db.serverDate(),
          createdAt: db.serverDate()
        }
      });
      return { familyId: f._id, status: f.needApproval ? 0 : 1 };
    },

    // 审批（管理员）
    async approve(event, me) {
      const mine = await myMembership(event.familyId, me._id);
      if (!mine || !mine.isAdmin) throw { code: 403, msg: '无审批权限' };
      const target = await db.collection(COL_M).doc(event.membershipId).get().then(r => r.data);
      if (!target || target.status !== 0) throw { code: 1, msg: '申请不存在或已处理' };
      if (event.pass) {
        await db.collection(COL_M).doc(event.membershipId).update({ data: { status: 1, joinedAt: db.serverDate() } });
      } else {
        await db.collection(COL_M).doc(event.membershipId).remove();
      }
      return { ok: true };
    },

    // 删除成员（管理员，不可删发起人）
    async removeMember(event, me) {
      const mine = await myMembership(event.familyId, me._id);
      if (!mine || !mine.isAdmin) throw { code: 403, msg: '无管理权限' };
      const f = await db.collection(COL_F).doc(event.familyId).get().then(r => r.data);
      const target = await db.collection(COL_M).doc(event.membershipId).get().then(r => r.data);
      if (!target) throw { code: 1, msg: '成员不存在' };
      if (f.founderId === target.userId) throw { code: 1, msg: '不可删除发起人' };
      await db.collection(COL_M).doc(event.membershipId).update({ data: { status: 2 } });
      return { ok: true };
    },

    // 任命/取消管理员
    async setAdmin(event, me) {
      const mine = await myMembership(event.familyId, me._id);
      if (!mine || !mine.isAdmin) throw { code: 403, msg: '无管理权限' };
      const f = await db.collection(COL_F).doc(event.familyId).get().then(r => r.data);
      const target = await db.collection(COL_M).doc(event.membershipId).get().then(r => r.data);
      if (!target) throw { code: 1, msg: '成员不存在' };
      if (f.founderId === target.userId) throw { code: 1, msg: '发起人身份不可更改' };
      await db.collection(COL_M).doc(event.membershipId).update({ data: { isAdmin: !!event.isAdmin } });
      return { ok: true };
    },

    // 切换自己的功能角色（0干饭人 / 1大厨）
    async switchRole(event, me) {
      const mine = await myMembership(event.familyId, me._id);
      if (!mine) throw { code: 403, msg: '你不是该家庭成员' };
      await db.collection(COL_M).doc(mine._id).update({ data: { kitchenRole: event.kitchenRole ? 1 : 0 } });
      return { kitchenRole: event.kitchenRole ? 1 : 0 };
    },

    // 退出家庭（发起人不可退出，需先解散）
    async leave(event, me) {
      const mine = await myMembership(event.familyId, me._id);
      if (!mine) throw { code: 403, msg: '你不是该家庭成员' };
      const f = await db.collection(COL_F).doc(event.familyId).get().then(r => r.data).catch(() => null);
      if (f && f.founderId === me._id) throw { code: 1, msg: '发起人不能退出，请先解散饭局' };
      await db.collection(COL_M).doc(mine._id).update({ data: { status: 2 } });
      return { ok: true };
    },

    // 解散家庭（仅发起人）：清理成员 / 约饭 / 点菜条目 / 家庭本身
    async dissolve(event, me) {
      const f = await db.collection(COL_F).doc(event.familyId).get().then(r => r.data).catch(() => null);
      if (!f) throw { code: 404, msg: '家庭不存在' };
      if (f.founderId !== me._id) throw { code: 403, msg: '仅发起人可解散饭局' };
      await removeAll(COL_M, { familyId: event.familyId });
      await removeAll(COL_MEAL, { familyId: event.familyId });
      await removeAll('meal_items', { familyId: event.familyId });
      await db.collection(COL_F).doc(event.familyId).remove();
      return { ok: true };
    },

    // 刷新邀请码（管理员）
    async refreshCode(event, me) {
      const mine = await myMembership(event.familyId, me._id);
      if (!mine || !mine.isAdmin) throw { code: 403, msg: '无管理权限' };
      const code = await uniqueCode();
      await db.collection(COL_F).doc(event.familyId).update({ data: { inviteCode: code } });
      return { inviteCode: code };
    },

    // 编辑饭局信息（管理员）：名称 + 加入是否需审批
    async updateInfo(event, me) {
      const mine = await myMembership(event.familyId, me._id);
      if (!mine || !mine.isAdmin) throw { code: 403, msg: '无管理权限' };
      const name = (event.name || '').trim();
      if (!name) throw { code: 1, msg: '请填写饭局名称' };
      await db.collection(COL_F).doc(event.familyId).update({ data: { name, needApproval: !!event.needApproval } });
      return { ok: true };
    }
  };
};
