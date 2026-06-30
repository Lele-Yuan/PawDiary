var cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
var db = cloud.database();
var _ = db.command;
var security = require('./contentSecurity');

exports.main = async function (event, context) {
  var OPENID = cloud.getWXContext().OPENID;
  var action = event.action;
  var data = event.data || {};

  switch (action) {
    case 'addPlace':
      return await addPlace(OPENID, data);
    case 'listPlaces':
      return await listPlaces(OPENID, data);
    case 'getPlace':
      return await getPlace(OPENID, data);
    case 'updatePlace':
      return await updatePlace(OPENID, data);
    case 'deletePlace':
      return await deletePlace(OPENID, data);
    case 'reportLocation':
      return await reportLocation(OPENID, data);
    default:
      return { code: -1, message: '未知操作类型' };
  }
};

/**
 * 平台管理员校验：users.role === 'admin'
 */
async function requireAdmin(openid) {
  try {
    var r = await db.collection('users').where({ _openid: openid }).limit(1).get();
    return r.data.length > 0 && r.data[0].role === 'admin';
  } catch (e) {
    return false;
  }
}

/**
 * Haversine 公式计算两点间球面距离（米）
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
 * 获取 5 分钟内活跃的在线用户列表
 */
async function getActiveUsers() {
  var fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  var res = await db.collection('user_locations')
    .where({ lastActiveTime: _.gte(fiveMinAgo) })
    .limit(200)
    .get();
  return res.data;
}

// 添加宠物友好地点（仅平台管理员）
async function addPlace(openid, data) {
  if (!(await requireAdmin(openid))) {
    return { code: -403, message: '仅管理员可操作' };
  }
  var name = (data.name || '').trim();
  if (!name) {
    return { code: -1, message: '地点名称不能为空' };
  }
  if (!data.latitude || !data.longitude) {
    return { code: -1, message: '请选择地点位置' };
  }

  // 内容安全
  var composedText = [name, data.description, data.address].filter(Boolean).join('\n');
  if (composedText) {
    var rt = await security.checkText(cloud, openid, composedText);
    if (!rt.pass) return security.violationResult();
  }
  if (Array.isArray(data.images) && data.images.length > 0) {
    var ri = await security.checkImagesByFileIds(cloud, data.images);
    if (!ri.pass) {
      await security.deleteFiles(cloud, data.images);
      return security.violationResult();
    }
  }

  var userRes = await db.collection('users').where({ _openid: openid }).limit(1).get();
  var user = userRes.data.length > 0 ? userRes.data[0] : {};

  var now = new Date();
  await db.collection('pet_places').add({
    data: {
      _openid: openid,
      name: name,
      description: data.description || '',
      category: data.category || 'other',
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address || '',
      images: data.images || [],
      creatorName: user.nickName || '',
      creatorAvatar: user.avatarUrl || '',
      status: 'active',
      createdAt: now,
      updatedAt: now
    }
  });

  return { code: 0, message: '添加成功' };
}

// 查询所有地点（附带每个地点 1km 内在线人数）
async function listPlaces(openid, data) {
  var lat = data.latitude;
  var lng = data.longitude;

  var res = await db.collection('pet_places')
    .where({ status: 'active' })
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  // 获取在线用户
  var activeUsers = await getActiveUsers();

  var places = [];
  for (var i = 0; i < res.data.length; i++) {
    var place = res.data[i];
    if (lat && lng) {
      place.distance = Math.round(getDistance(lat, lng, place.latitude, place.longitude));
    } else {
      place.distance = 0;
    }
    place.isOwner = place._openid === openid;

    // 计算该地点 1km 内在线用户数
    var count = 0;
    for (var j = 0; j < activeUsers.length; j++) {
      var u = activeUsers[j];
      var dist = getDistance(place.latitude, place.longitude, u.latitude, u.longitude);
      if (dist <= 1000) {
        count++;
      }
    }
    place.onlineCount = count;

    places.push(place);
  }

  places.sort(function (a, b) {
    return a.distance - b.distance;
  });

  return { code: 0, data: places };
}

// 获取单个地点详情 + 1km 内在线用户列表
async function getPlace(openid, data) {
  var placeId = data.placeId;
  var lat = data.latitude;
  var lng = data.longitude;
  if (!placeId) {
    return { code: -1, message: '缺少地点ID' };
  }

  try {
    var placeRes = await db.collection('pet_places').doc(placeId).get();
    var place = placeRes.data;
    if (!place || place.status !== 'active') {
      return { code: -1, message: '地点不存在' };
    }

    // 计算用户到地点的距离
    if (lat && lng) {
      place.distance = Math.round(getDistance(lat, lng, place.latitude, place.longitude));
    } else {
      place.distance = 0;
    }
    place.isOwner = place._openid === openid;

    // 查询在线用户并筛选 1km 内
    var activeUsers = await getActiveUsers();
    var onlineUsers = [];
    for (var i = 0; i < activeUsers.length; i++) {
      var u = activeUsers[i];
      var dist = getDistance(place.latitude, place.longitude, u.latitude, u.longitude);
      if (dist <= 1000) {
        onlineUsers.push({
          nickName: u.nickName,
          avatarUrl: u.avatarUrl,
          distance: Math.round(dist)
        });
      }
    }
    onlineUsers.sort(function (a, b) {
      return a.distance - b.distance;
    });

    return { code: 0, data: { place: place, onlineUsers: onlineUsers } };
  } catch (e) {
    return { code: -1, message: '地点不存在' };
  }
}

// 更新地点（仅平台管理员）
async function updatePlace(openid, data) {
  var placeId = data.placeId;
  if (!placeId) {
    return { code: -1, message: '缺少地点ID' };
  }
  if (!(await requireAdmin(openid))) {
    return { code: -403, message: '仅管理员可操作' };
  }

  try {
    var placeRes = await db.collection('pet_places').doc(placeId).get();
    var place = placeRes.data;
    if (!place || place.status !== 'active') {
      return { code: -1, message: '地点不存在' };
    }

    // 内容安全
    var composedText = [data.name, data.description].filter(Boolean).join('\n');
    if (composedText) {
      var rt = await security.checkText(cloud, openid, composedText);
      if (!rt.pass) return security.violationResult();
    }
    if (Array.isArray(data.images) && data.images.length > 0) {
      var oldImages = Array.isArray(place.images) ? place.images : [];
      var newImages = data.images.filter(function (id) { return oldImages.indexOf(id) === -1; });
      if (newImages.length > 0) {
        var ri = await security.checkImagesByFileIds(cloud, newImages);
        if (!ri.pass) {
          await security.deleteFiles(cloud, newImages);
          return security.violationResult();
        }
      }
    }

    var updateData = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = (data.name || '').trim();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.images !== undefined) updateData.images = data.images;

    if (updateData.name === '') {
      return { code: -1, message: '地点名称不能为空' };
    }

    await db.collection('pet_places').doc(placeId).update({
      data: updateData
    });

    return { code: 0, message: '更新成功' };
  } catch (e) {
    return { code: -1, message: '地点不存在' };
  }
}

// 删除地点（仅平台管理员）
async function deletePlace(openid, data) {
  var placeId = data.placeId;
  if (!placeId) {
    return { code: -1, message: '缺少地点ID' };
  }
  if (!(await requireAdmin(openid))) {
    return { code: -403, message: '仅管理员可操作' };
  }

  try {
    var placeRes = await db.collection('pet_places').doc(placeId).get();
    var place = placeRes.data;
    if (!place) {
      return { code: -1, message: '地点不存在' };
    }

    await db.collection('pet_places').doc(placeId).update({
      data: { status: 'archived', updatedAt: new Date() }
    });

    return { code: 0, message: '删除成功' };
  } catch (e) {
    return { code: -1, message: '地点不存在' };
  }
}

// 上报用户位置（upsert）
async function reportLocation(openid, data) {
  if (!data.latitude || !data.longitude) {
    return { code: -1, message: '缺少位置信息' };
  }

  var userRes = await db.collection('users').where({ _openid: openid }).limit(1).get();
  var user = userRes.data.length > 0 ? userRes.data[0] : {};

  var now = new Date();
  var locationData = {
    latitude: data.latitude,
    longitude: data.longitude,
    nickName: user.nickName,
    avatarUrl: user.avatarUrl || '',
    lastActiveTime: now,
    updatedAt: now
  };

  var existRes = await db.collection('user_locations')
    .where({ _openid: openid })
    .limit(1)
    .get();

  if (existRes.data.length > 0) {
    await db.collection('user_locations').doc(existRes.data[0]._id).update({
      data: locationData
    });
  } else {
    await db.collection('user_locations').add({
      data: Object.assign({ _openid: openid }, locationData)
    });
  }

  return { code: 0, message: '上报成功' };
}
