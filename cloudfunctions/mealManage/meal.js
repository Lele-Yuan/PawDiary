// cloudfunctions/mealManage/meal.js —— 约饭主流程：开桌 / 点菜 / 取消点菜 / 当前状态（+ order.js 下单小票）
module.exports = function (db, _, helpers) {
  const COL_D = 'meal_dishes', COL_MEAL = 'meal_meals', COL_ITEM = 'meal_items';
  const { myMembership } = helpers;

  const actions = {
    // 当前约饭状态
    async current(event, me) {
      const mine = await myMembership(event.familyId, me._id);
      if (!mine) throw { code: 403, msg: '你不是该家庭成员' };

      const mr = await db.collection(COL_MEAL)
        .where({ familyId: event.familyId, status: _.in([0, 1]) })
        .orderBy('createdAt', 'desc').limit(1).get();
      if (!mr.data.length) return { meal: null, myPicks: [], counts: {} };

      const meal = mr.data[0];
      const items = await db.collection(COL_ITEM).where({ mealId: meal._id }).get();

      const counts = {}, myPicks = [];
      items.data.forEach(it => {
        counts[it.dishId] = (counts[it.dishId] || 0) + 1;
        if (it.userId === me._id) myPicks.push(it.dishId);
      });
      return {
        meal: { _id: meal._id, status: meal.status, seq: meal.seq, isAdmin: !!mine.isAdmin },
        myPicks, counts
      };
    },

    // 开桌
    async start(event, me) {
      const mine = await myMembership(event.familyId, me._id);
      if (!mine) throw { code: 403, msg: '你不是该家庭成员' };

      const active = await db.collection(COL_MEAL)
        .where({ familyId: event.familyId, status: _.in([0, 1]) }).count();
      if (active.total > 0) throw { code: 1, msg: '已有进行中的约饭' };

      const done = await db.collection(COL_MEAL).where({ familyId: event.familyId }).count();
      const add = await db.collection(COL_MEAL).add({
        data: {
          familyId: event.familyId, seq: done.total + 1, status: 0,
          starterId: me._id, totalDuration: 0,
          createdAt: db.serverDate(), updatedAt: db.serverDate()
        }
      });
      return { mealId: add._id, seq: done.total + 1, status: 0 };
    },

    // 点菜
    async pick(event, me) {
      const meal = await db.collection(COL_MEAL).doc(event.mealId).get().then(r => r.data).catch(() => null);
      if (!meal) throw { code: 404, msg: '约饭不存在' };
      if (meal.status !== 0) throw { code: 1, msg: '约饭已下单，无法再点菜' };
      const mine = await myMembership(meal.familyId, me._id);
      if (!mine) throw { code: 403, msg: '你不是该家庭成员' };

      const dish = await db.collection(COL_D).doc(event.dishId).get().then(r => r.data).catch(() => null);
      if (!dish || dish.deleted) throw { code: 1, msg: '菜品不存在' };

      const existed = await db.collection(COL_ITEM)
        .where({ mealId: event.mealId, dishId: event.dishId, userId: me._id }).get();
      if (existed.data.length) return { ok: true, dup: true };

      await db.collection(COL_ITEM).add({
        data: {
          mealId: event.mealId, familyId: meal.familyId,
          dishId: event.dishId, dishOwnerId: dish.ownerId,
          userId: me._id, createdAt: db.serverDate()
        }
      });
      return { ok: true };
    },

    // 取消点菜（仅能取消自己的）
    async unpick(event, me) {
      const meal = await db.collection(COL_MEAL).doc(event.mealId).get().then(r => r.data).catch(() => null);
      if (!meal) throw { code: 404, msg: '约饭不存在' };
      if (meal.status !== 0) throw { code: 1, msg: '约饭已下单，无法修改' };

      const r = await db.collection(COL_ITEM)
        .where({ mealId: event.mealId, dishId: event.dishId, userId: me._id }).get();
      for (const it of r.data) await db.collection(COL_ITEM).doc(it._id).remove();
      return { ok: true };
    }
  };

  Object.assign(actions, require('./order.js')(db, _, helpers));
  return actions;
};
