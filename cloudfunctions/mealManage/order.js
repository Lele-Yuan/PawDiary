// cloudfunctions/mealManage/order.js —— 下单 / 完成 / 小票 / 历史
module.exports = function (db, _, helpers) {
  const COL_U = 'meal_users', COL_F = 'meal_families', COL_D = 'meal_dishes',
        COL_MEAL = 'meal_meals', COL_ITEM = 'meal_items';
  const { myMembership } = helpers;

  async function buildReceipt(meal) {
    const f = await db.collection(COL_F).doc(meal.familyId).get().then(r => r.data).catch(() => null);
    const items = await db.collection(COL_ITEM).where({ mealId: meal._id }).get();

    const userIds = [...new Set(items.data.map(i => i.userId))];
    const userMap = {};
    if (userIds.length) {
      const ur = await db.collection(COL_U).where({ _id: _.in(userIds) }).get();
      ur.data.forEach(u => { userMap[u._id] = u.nickName || '匿名'; });
    }

    const dishMap = {};
    for (const it of items.data) {
      const snap = it.dishSnapshot;
      let d = snap;
      if (!d) {
        d = await db.collection(COL_D).doc(it.dishId).get().then(r => r.data).catch(() => null);
      }
      if (!d) continue;
      if (!dishMap[it.dishId]) {
        dishMap[it.dishId] = {
          dishId: it.dishId, name: d.name, imageUrl: d.imageUrl || '',
          duration: Number(d.duration) || 0,
          ingredients: d.ingredients || [], tastes: d.tastes || [],
          remark: d.remark || '', count: 0, pickers: []
        };
      }
      dishMap[it.dishId].count += 1;
      dishMap[it.dishId].pickers.push(userMap[it.userId] || '匿名');
    }
    const dishes = Object.values(dishMap);

    const ingSet = {}, tasteSet = {}, remarks = [];
    let totalDuration = 0, pickTotal = 0;
    dishes.forEach(d => {
      totalDuration += d.duration;
      pickTotal += d.count;
      (d.ingredients || []).forEach(g => {
        const key = g.name || g;
        ingSet[key] = { name: key, emoji: g.emoji || '' };
      });
      (d.tastes || []).forEach(t => {
        const key = t.name || t;
        tasteSet[key] = { name: key, emoji: t.emoji || '' };
      });
      if (d.remark) remarks.push(`${d.name}：${d.remark}`);
    });

    return {
      familyName: f ? f.name : '',
      seq: meal.seq, status: meal.status, mealId: meal._id,
      dishes, dishCount: dishes.length, pickTotal,
      ingredients: Object.values(ingSet),
      tastes: Object.values(tasteSet),
      remarks,
      members: meal.memberSnapshot || [],
      memberCount: (meal.memberSnapshot || []).length,
      totalDuration: meal.totalDuration || totalDuration,
      orderedAt: meal.orderedAt || null,
      finishedAt: meal.finishedAt || null
    };
  }
  // ORDER_PLACEHOLDER
  return {
    // 下单（管理员）：写入菜品快照、计算总时长、状态→已下单
    async submit(event, me) {
      const meal = await db.collection(COL_MEAL).doc(event.mealId).get().then(r => r.data).catch(() => null);
      if (!meal) throw { code: 404, msg: '约饭不存在' };
      if (meal.status !== 0) throw { code: 1, msg: '约饭已下单' };
      const mine = await myMembership(meal.familyId, me._id);
      if (!mine || !mine.isAdmin) throw { code: 403, msg: '仅管理员可下单' };

      const items = await db.collection(COL_ITEM).where({ mealId: meal._id }).get();
      if (!items.data.length) throw { code: 1, msg: '还没有人点菜' };

      const distinct = {};
      for (const it of items.data) {
        const d = await db.collection(COL_D).doc(it.dishId).get().then(r => r.data).catch(() => null);
        if (!d) continue;
        const snap = {
          name: d.name, imageUrl: d.imageUrl || '', duration: Number(d.duration) || 0,
          ingredients: d.ingredients || [], tastes: d.tastes || [], remark: d.remark || ''
        };
        await db.collection(COL_ITEM).doc(it._id).update({ data: { dishSnapshot: snap } });
        if (!distinct[it.dishId]) distinct[it.dishId] = Number(d.duration) || 0;
      }
      const totalDuration = Object.values(distinct).reduce((a, b) => a + b, 0);

      // 快照当时在册成员（下单即定格，后续增减不影响本小票）
      const mems = await db.collection('meal_memberships').where({ familyId: meal.familyId, status: 1 }).get();
      const memUserIds = mems.data.map(m => m.userId);
      const memUserMap = {};
      if (memUserIds.length) {
        const mu = await db.collection(COL_U).where({ _id: _.in(memUserIds) }).get();
        mu.data.forEach(u => { memUserMap[u._id] = u; });
      }
      const memberSnapshot = mems.data.map(m => {
        const u = memUserMap[m.userId] || {};
        return { userId: m.userId, nickName: u.nickName || '匿名', avatarUrl: u.avatarUrl || '' };
      });

      await db.collection(COL_MEAL).doc(meal._id).update({
        data: { status: 1, totalDuration, orderUserId: me._id, memberSnapshot, orderedAt: db.serverDate(), updatedAt: db.serverDate() }
      });
      return { ok: true, totalDuration };
    },

    // 完成（管理员）：已下单→已完成
    async finish(event, me) {
      const meal = await db.collection(COL_MEAL).doc(event.mealId).get().then(r => r.data).catch(() => null);
      if (!meal) throw { code: 404, msg: '约饭不存在' };
      if (meal.status !== 1) throw { code: 1, msg: '状态不正确' };
      const mine = await myMembership(meal.familyId, me._id);
      if (!mine || !mine.isAdmin) throw { code: 403, msg: '仅管理员可操作' };

      await db.collection(COL_MEAL).doc(meal._id).update({
        data: { status: 2, finishedAt: db.serverDate(), updatedAt: db.serverDate() }
      });
      return { ok: true };
    },

    // 小票详情
    async receipt(event, me) {
      const meal = await db.collection(COL_MEAL).doc(event.mealId).get().then(r => r.data).catch(() => null);
      if (!meal) throw { code: 404, msg: '约饭不存在' };
      const mine = await myMembership(meal.familyId, me._id);
      if (!mine) throw { code: 403, msg: '你不是该家庭成员' };
      return await buildReceipt(meal);
    },

    // 历史小票（已完成）
    async history(event, me) {
      const mine = await myMembership(event.familyId, me._id);
      if (!mine) throw { code: 403, msg: '你不是该家庭成员' };
      const r = await db.collection(COL_MEAL)
        .where({ familyId: event.familyId, status: 2 })
        .orderBy('createdAt', 'desc').limit(50).get();

      const list = [];
      for (const meal of r.data) {
        const items = await db.collection(COL_ITEM).where({ mealId: meal._id }).get();
        const names = {}, emojis = {};
        items.data.forEach(it => {
          const d = it.dishSnapshot;
          if (!d) return;
          names[it.dishId] = d.name;
          (d.ingredients || []).forEach(g => { emojis[g.name || g] = g.emoji || ''; });
        });
        list.push({
          mealId: meal._id, seq: meal.seq,
          dishCount: Object.keys(names).length,
          pickTotal: items.data.length,
          totalDuration: meal.totalDuration || 0,
          emojis: Object.values(emojis).filter(Boolean).slice(0, 8),
          members: (meal.memberSnapshot || []).slice(0, 5),
          memberCount: (meal.memberSnapshot || []).length,
          finishedAt: meal.finishedAt || null,
          createdAt: meal.createdAt || null
        });
      }
      return { list };
    }
  };
};
