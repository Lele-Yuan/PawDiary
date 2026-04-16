/**
 * 资源限额工具模块
 * 管理每日上传照片、新增宠物、新增地点的次数限制
 */

var DAILY_STATS_KEY = 'pawdiary_daily_stats';

/** 单张照片最大体积：500KB */
var MAX_PHOTO_SIZE = 500 * 1024;

/** 每日最多上传照片数 */
var MAX_DAILY_PHOTOS = 5;

/** 每日最多新增宠物数 */
var MAX_DAILY_PETS = 2;

/** 每日最多新增地点数 */
var MAX_DAILY_PLACES = 2;

/** 单条详情最多照片数 */
var MAX_PHOTOS_PER_DETAIL = 5;

function getToday() {
  var d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

/**
 * 获取今日统计，跨天自动重置为零
 */
function getDailyStats() {
  var today = getToday();
  var stats;
  try {
    stats = wx.getStorageSync(DAILY_STATS_KEY);
  } catch (e) {
    stats = null;
  }
  if (!stats || stats.date !== today) {
    stats = { date: today, photoCount: 0, petCount: 0, placeCount: 0 };
  }
  return stats;
}

function saveDailyStats(stats) {
  try {
    wx.setStorageSync(DAILY_STATS_KEY, stats);
  } catch (e) {}
}

/**
 * 检查今日是否还能上传 count 张照片
 * @param {number} count 本次待上传数量
 * @returns {{ ok: boolean, remaining: number }}
 */
function checkPhotoLimit(count) {
  count = count || 1;
  var stats = getDailyStats();
  var remaining = MAX_DAILY_PHOTOS - stats.photoCount;
  return {
    ok: stats.photoCount + count <= MAX_DAILY_PHOTOS,
    remaining: remaining < 0 ? 0 : remaining
  };
}

/**
 * 上传成功后增加照片计数
 * @param {number} count 本次成功上传数量
 */
function incrementPhotoCount(count) {
  count = count || 1;
  var stats = getDailyStats();
  stats.photoCount += count;
  saveDailyStats(stats);
}

/**
 * 检查今日是否还能新增宠物
 * @returns {boolean}
 */
function checkPetLimit() {
  return getDailyStats().petCount < MAX_DAILY_PETS;
}

/**
 * 新增宠物成功后递增计数
 */
function incrementPetCount() {
  var stats = getDailyStats();
  stats.petCount++;
  saveDailyStats(stats);
}

/**
 * 检查今日是否还能新增地点
 * @returns {boolean}
 */
function checkPlaceLimit() {
  return getDailyStats().placeCount < MAX_DAILY_PLACES;
}

/**
 * 新增地点成功后递增计数
 */
function incrementPlaceCount() {
  var stats = getDailyStats();
  stats.placeCount++;
  saveDailyStats(stats);
}

/**
 * 过滤超过500KB的文件
 * @param {Array} tempFiles wx.chooseMedia 返回的 tempFiles 数组
 * @returns {{ validFiles: Array, oversizedCount: number }}
 */
function checkImageSize(tempFiles) {
  var validFiles = [];
  var oversizedCount = 0;
  for (var i = 0; i < tempFiles.length; i++) {
    if (tempFiles[i].size > MAX_PHOTO_SIZE) {
      oversizedCount++;
    } else {
      validFiles.push(tempFiles[i]);
    }
  }
  return { validFiles: validFiles, oversizedCount: oversizedCount };
}

module.exports = {
  MAX_PHOTOS_PER_DETAIL: MAX_PHOTOS_PER_DETAIL,
  checkPhotoLimit: checkPhotoLimit,
  incrementPhotoCount: incrementPhotoCount,
  checkPetLimit: checkPetLimit,
  incrementPetCount: incrementPetCount,
  checkPlaceLimit: checkPlaceLimit,
  incrementPlaceCount: incrementPlaceCount,
  checkImageSize: checkImageSize
};
