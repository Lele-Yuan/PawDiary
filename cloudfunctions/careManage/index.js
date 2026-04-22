var cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
var db = cloud.database();
var _ = db.command;

exports.main = async function (event, context) {
  var OPENID = cloud.getWXContext().OPENID;
  var action = event.action;
  var data = event.data || {};

  switch (action) {
    case 'publish':
      return await publishPost(OPENID, data);
    case 'list':
      return await listPosts(OPENID, data);
    case 'get':
      return await getPost(OPENID, data);
    case 'applyContact':
      return await applyContact(OPENID, data);
    case 'update':
      return await updatePost(OPENID, data);
    case 'delete':
      return await deletePost(OPENID, data);
    case 'myPosts':
      return await myPosts(OPENID, data);
    default:
      return { code: -1, message: '未知操作类型' };
  }
};

/**
 * Haversine 公式计算两点间距离（米）
 */
function getDistance(lat1, lng1, lat2, lng2) {
  var R = 6371000;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLng = (lng2 - lng1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 格式化距离显示文本
 */
function formatDistance(meters) {
  if (meters < 1000) {
    return Math.round(meters) + 'm';
  }
  return (meters / 1000).toFixed(1) + 'km';
}

/**
 * 发布互助帖子
 */
async function publishPost(openid, data) {
  if (!data.role || !['helper', 'owner'].includes(data.role)) {
    return { code: -1, message: '请选择角色类型' };
  }
  if (!data.serviceType || !['poop', 'walk', 'other'].includes(data.serviceType)) {
    return { code: -1, message: '请选择服务类型' };
  }
  if (!data.location || !data.location.latitude || !data.location.longitude) {
    return { code: -1, message: '请选择服务地点' };
  }
  var t = data.availableTime;
  if (!t) return { code: -1, message: '请填写可用时间' };
  if (t.mode === 'multi' && (!t.selectedDates || !t.selectedDates.length)) {
    return { code: -1, message: '请选择至少一个日期' };
  }
  if (t.mode !== 'multi' && !t.startDate) {
    return { code: -1, message: '请选择可用日期' };
  }
  if (!data.contactInfo || (!data.contactInfo.phone && !data.contactInfo.wechat)) {
    return { code: -1, message: '请至少填写一种联系方式' };
  }

  // 获取发布人信息快照
  var userRes = await db.collection('users').where({ _openid: openid }).limit(1).get();
  var user = userRes.data.length > 0 ? userRes.data[0] : {};

  var now = new Date();
  var postData = {
    _openid: openid,
    role: data.role,
    serviceType: data.serviceType,
    title: data.title || '',
    description: data.description || '',
    location: {
      address: data.location.address || '',
      latitude: data.location.latitude,
      longitude: data.location.longitude
    },
    radius: data.role === 'helper' ? (data.radius || 3) : 0,
    availableTime: {
      mode: (data.availableTime && data.availableTime.mode) || 'range',
      startDate: (data.availableTime && data.availableTime.startDate) || '',
      endDate: (data.availableTime && data.availableTime.endDate) || '',
      startTime: (data.availableTime && data.availableTime.startTime) || '',
      endTime: (data.availableTime && data.availableTime.endTime) || '',
      selectedDates: (data.availableTime && data.availableTime.selectedDates) || [],
      timeDesc: (data.availableTime && data.availableTime.timeDesc) || ''
    },
    contactInfo: {
      phone: data.contactInfo.phone || '',
      wechat: data.contactInfo.wechat || ''
    },
    petInfo: data.role === 'owner' ? {
      name: (data.petInfo && data.petInfo.name) || '',
      breed: (data.petInfo && data.petInfo.breed) || '',
      weight: (data.petInfo && data.petInfo.weight) || ''
    } : null,
    status: 'active',
    applicants: [],
    publisherInfo: {
      nickname: user.nickName || '未知用户',
      avatarUrl: user.avatarUrl || ''
    },
    createTime: now,
    updateTime: now
  };

  var res = await db.collection('pet_care_posts').add({ data: postData });
  return { code: 0, data: { _id: res._id } };
}

/**
 * 查询互助帖子列表（含距离计算，脱敏联系方式）
 */
async function listPosts(openid, data) {
  var lat = data.latitude;
  var lng = data.longitude;
  var roleFilter = data.roleFilter;
  var serviceTypeFilter = data.serviceTypeFilter;
  var dateFilter = data.dateFilter || '';  // 'YYYY-MM-DD'
  var onlyMine = data.onlyMine || false;
  var pageSize = data.pageSize || 20;
  var page = data.page || 0;

  var whereCondition = { status: 'active' };
  if (roleFilter && roleFilter !== 'all') {
    whereCondition.role = roleFilter;
  }
  if (onlyMine) {
    whereCondition._openid = openid;
  }

  var res;
  if (serviceTypeFilter && serviceTypeFilter !== 'all') {
    var andConds = [
      { status: 'active' },
      { serviceType: serviceTypeFilter },
      roleFilter && roleFilter !== 'all' ? { role: roleFilter } : {}
    ];
    if (onlyMine) andConds.push({ _openid: openid });
    res = await db.collection('pet_care_posts')
      .where(_.and(andConds))
      .orderBy('createTime', 'desc')
      .skip(page * pageSize)
      .limit(pageSize)
      .get();
  } else {
    res = await db.collection('pet_care_posts')
      .where(whereCondition)
      .orderBy('createTime', 'desc')
      .skip(page * pageSize)
      .limit(pageSize)
      .get();
  }

  var posts = res.data;

  // 计算距离并脱敏
  for (var i = 0; i < posts.length; i++) {
    var post = posts[i];
    if (lat && lng && post.location) {
      post.distance = Math.round(getDistance(lat, lng, post.location.latitude, post.location.longitude));
      post.distanceText = formatDistance(post.distance);
    } else {
      post.distance = 0;
      post.distanceText = '--';
    }
    post.isOwner = post._openid === openid;
    // 脱敏：不返回联系方式和申请人列表
    delete post.contactInfo;
    delete post.applicants;
  }

  // 日期过滤（在内存中过滤，兼容新旧格式）
  if (dateFilter) {
    posts = posts.filter(function (post) {
      var t = post.availableTime;
      if (!t) return true;
      if (t.mode === 'multi') {
        return Array.isArray(t.selectedDates) && t.selectedDates.indexOf(dateFilter) !== -1;
      }
      // range 或旧格式
      if (t.startDate) {
        var endOk = !t.endDate || t.endDate >= dateFilter;
        return t.startDate <= dateFilter && endOk;
      }
      return true;
    });
  }

  // 默认按距离排序
  if (lat && lng) {
    posts.sort(function (a, b) { return a.distance - b.distance; });
  }

  return { code: 0, data: { list: posts, total: posts.length, page: page } };
}

/**
 * 获取单条帖子详情（非本人不返回联系方式）
 */
async function getPost(openid, data) {
  var postId = data.postId;
  if (!postId) return { code: -1, message: '缺少帖子ID' };

  try {
    var res = await db.collection('pet_care_posts').doc(postId).get();
    var post = res.data;
    if (!post || post.status === 'archived') {
      return { code: -1, message: '帖子不存在或已关闭' };
    }
    post.isOwner = post._openid === openid;
    if (!post.isOwner) {
      delete post.contactInfo;
    }
    delete post.applicants;
    return { code: 0, data: post };
  } catch (e) {
    return { code: -1, message: '帖子不存在' };
  }
}

/**
 * 申请联系（幂等写申请记录，返回联系方式）
 */
async function applyContact(openid, data) {
  var postId = data.postId;
  if (!postId) return { code: -1, message: '缺少帖子ID' };

  try {
    var postRes = await db.collection('pet_care_posts').doc(postId).get();
    var post = postRes.data;

    if (!post || post.status !== 'active') {
      return { code: -1, message: '帖子已关闭' };
    }
    if (post._openid === openid) {
      return { code: -1, message: '不能申请自己的帖子' };
    }

    // 检查是否已申请（幂等）
    var existing = await db.collection('pet_care_contacts')
      .where({ postId: postId, applicantOpenid: openid })
      .limit(1)
      .get();

    if (!existing.data.length) {
      // 获取申请人信息快照
      var userRes = await db.collection('users').where({ _openid: openid }).limit(1).get();
      var user = userRes.data.length > 0 ? userRes.data[0] : {};

      await db.collection('pet_care_contacts').add({
        data: {
          postId: postId,
          applicantOpenid: openid,
          applicantInfo: {
            nickname: user.nickName || '未知用户',
            avatarUrl: user.avatarUrl || ''
          },
          status: 'revealed',
          createTime: new Date()
        }
      });

      // 同步更新帖子申请人列表
      await db.collection('pet_care_posts').doc(postId).update({
        data: {
          applicants: _.push(openid),
          updateTime: new Date()
        }
      });
    }

    return { code: 0, data: { contactInfo: post.contactInfo } };
  } catch (e) {
    return { code: -1, message: '操作失败：' + e.message };
  }
}

/**
 * 更新帖子（仅本人）
 */
async function updatePost(openid, data) {
  var postId = data.postId;
  if (!postId) return { code: -1, message: '缺少帖子ID' };

  // 单独 try get，区分"帖子不存在"和其他错误
  var post;
  try {
    var postRes = await db.collection('pet_care_posts').doc(postId).get();
    post = postRes.data;
  } catch (e) {
    return { code: -1, message: '帖子不存在' };
  }

  if (!post) return { code: -1, message: '帖子不存在' };
  if (post._openid !== openid) return { code: -1, message: '仅本人可编辑' };

  var updateData = { updateTime: new Date() };
  var fields = ['role', 'serviceType', 'exoticPetType', 'title', 'description', 'location', 'radius', 'availableTime', 'contactInfo', 'petInfo', 'status'];
  fields.forEach(function (f) {
    if (data[f] !== undefined) updateData[f] = data[f];
  });

  // petInfo 为 null 的帖子（helper 角色）无法写入子字段，统一处理
  var effectiveRole = updateData.role || post.role;
  if (effectiveRole === 'helper') {
    updateData.petInfo = null;
  }

  try {
    await db.collection('pet_care_posts').doc(postId).update({ data: updateData });
    return { code: 0, message: '更新成功' };
  } catch (e) {
    return { code: -1, message: '更新失败：' + e.message };
  }
}

/**
 * 软删除帖子（仅本人）
 */
async function deletePost(openid, data) {
  var postId = data.postId;
  if (!postId) return { code: -1, message: '缺少帖子ID' };

  try {
    var postRes = await db.collection('pet_care_posts').doc(postId).get();
    var post = postRes.data;
    if (!post) return { code: -1, message: '帖子不存在' };
    if (post._openid !== openid) return { code: -1, message: '仅本人可删除' };

    await db.collection('pet_care_posts').doc(postId).update({
      data: { status: 'archived', updateTime: new Date() }
    });
    return { code: 0, message: '已删除' };
  } catch (e) {
    return { code: -1, message: '帖子不存在' };
  }
}

/**
 * 查询我发布的帖子
 */
async function myPosts(openid, data) {
  var statusFilter = data.status;
  var whereCondition = { _openid: openid };
  if (statusFilter) {
    whereCondition.status = statusFilter;
  } else {
    whereCondition.status = _.neq('archived');
  }

  var res = await db.collection('pet_care_posts')
    .where(whereCondition)
    .orderBy('createTime', 'desc')
    .limit(50)
    .get();

  return { code: 0, data: res.data };
}
