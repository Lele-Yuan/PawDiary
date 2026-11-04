// cloudfunctions/mealManage/dish.js —— 菜品(全局资产) + 可点池 + 基础库
module.exports = function (db, _, helpers) {
  const COL_U = 'meal_users', COL_M = 'meal_memberships', COL_D = 'meal_dishes',
        COL_ING = 'meal_ingredients', COL_TASTE = 'meal_tastes';

  return {
    // 我的全局菜品
    async myList(event, me) {
      const r = await db.collection(COL_D)
        .where({ ownerId: me._id, deleted: _.neq(true) })
        .orderBy('createdAt', 'desc').get();
      return r.data;
    },

    // 新增 / 编辑菜品
    async save(event, me) {
      const d = event.dish || {};
      if (!d.name || !d.name.trim()) throw { code: 1, msg: '请填写菜品名称' };
      if (!d.ingredients || !d.ingredients.length) throw { code: 1, msg: '请至少选择一种食材' };
      const payload = {
        name: d.name.trim(),
        imageUrl: d.imageUrl || '',
        duration: Number(d.duration) || 0,
        remark: d.remark || '',
        ingredients: d.ingredients || [],
        tastes: d.tastes || [],
        deleted: false,
        updatedAt: db.serverDate()
      };
      if (d._id) {
        const old = await db.collection(COL_D).doc(d._id).get().then(r => r.data).catch(() => null);
        if (!old || old.ownerId !== me._id) throw { code: 403, msg: '无权编辑该菜品' };
        await db.collection(COL_D).doc(d._id).update({ data: payload });
        return { _id: d._id };
      }
      payload.ownerId = me._id;
      payload.createdAt = db.serverDate();
      const add = await db.collection(COL_D).add({ data: payload });
      return { _id: add._id };
    },

    // 删除菜品（软删除）
    async remove(event, me) {
      const old = await db.collection(COL_D).doc(event.dishId).get().then(r => r.data).catch(() => null);
      if (!old || old.ownerId !== me._id) throw { code: 403, msg: '无权删除该菜品' };
      await db.collection(COL_D).doc(event.dishId).update({ data: { deleted: true, updatedAt: db.serverDate() } });
      return { ok: true };
    },

    // 家庭可点池 = 在册(status=1)大厨(kitchenRole=1)成员的全部未删除菜品
    async poolList(event, me) {
      const mine = await db.collection(COL_M)
        .where({ familyId: event.familyId, userId: me._id, status: 1 }).get();
      if (!mine.data.length) throw { code: 403, msg: '你不是该家庭成员' };

      const cooks = await db.collection(COL_M)
        .where({ familyId: event.familyId, status: 1, kitchenRole: 1 }).get();
      const cookIds = cooks.data.map(m => m.userId);
      if (!cookIds.length) return { dishes: [], ownerMap: {} };

      const dishes = await db.collection(COL_D)
        .where({ ownerId: _.in(cookIds), deleted: _.neq(true) }).get();
      const users = await db.collection(COL_U).where({ _id: _.in(cookIds) }).get();
      const ownerMap = {};
      users.data.forEach(u => { ownerMap[u._id] = u.nickName || '匿名'; });
      return { dishes: dishes.data, ownerMap };
    },

    // 系统食材库
    async ingredients() {
      const r = await db.collection(COL_ING).orderBy('sort', 'asc').limit(200).get();
      return r.data;
    },
    // 系统口味库
    async tastes() {
      const r = await db.collection(COL_TASTE).orderBy('sort', 'asc').limit(50).get();
      return r.data;
    }
  };
};
