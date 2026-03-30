/**
 * 云开发封装 — 统一调用入口
 */

/**
 * 调用云函数（带错误处理和加载提示）
 * @param {string} name 云函数名称
 * @param {object} data 传入参数
 * @param {boolean} showLoading 是否显示加载提示
 * @returns {Promise<any>}
 */
const callFunction = async (name, data = {}, showLoading = false) => {
  if (showLoading) {
    wx.showLoading({ title: '加载中...', mask: true });
  }
  try {
    const res = await wx.cloud.callFunction({ name, data });
    if (showLoading) wx.hideLoading();

    if (res.result && res.result.code === -1) {
      console.error(`云函数 ${name} 业务错误:`, res.result.message);
      wx.showToast({ title: res.result.message || '操作失败', icon: 'none' });
      return null;
    }
    return res.result;
  } catch (err) {
    if (showLoading) wx.hideLoading();
    console.error(`云函数 ${name} 调用失败:`, err);
    wx.showToast({ title: '网络异常，请重试', icon: 'none' });
    return null;
  }
};

/**
 * 数据库查询封装（带分页）
 * @param {string} collection 集合名
 * @param {object} where 查询条件
 * @param {object} options 可选配置 { orderBy, limit, skip }
 * @returns {Promise<Array>}
 */
const dbQuery = async (collection, where = {}, options = {}) => {
  try {
    const db = wx.cloud.database();
    let query = db.collection(collection).where(where);

    if (options.orderBy) {
      const orders = Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy];
      orders.forEach(order => {
        query = query.orderBy(order.field, order.direction || 'desc');
      });
    }

    if (options.skip) {
      query = query.skip(options.skip);
    }

    query = query.limit(options.limit || 20);

    const { data } = await query.get();
    return data;
  } catch (err) {
    console.error(`查询集合 ${collection} 失败:`, err);
    return [];
  }
};

/**
 * 数据库添加文档
 * @param {string} collection 集合名
 * @param {object} data 文档数据
 * @returns {Promise<string|null>} 文档ID
 */
const dbAdd = async (collection, data) => {
  try {
    const db = wx.cloud.database();
    const res = await db.collection(collection).add({
      data: {
        ...data,
        createdAt: new Date()
      }
    });
    return res._id;
  } catch (err) {
    console.error(`添加到集合 ${collection} 失败:`, err);
    return null;
  }
};

/**
 * 数据库更新文档
 * @param {string} collection 集合名
 * @param {string} docId 文档ID
 * @param {object} data 更新数据
 * @returns {Promise<boolean>}
 */
const dbUpdate = async (collection, docId, data) => {
  try {
    const db = wx.cloud.database();
    await db.collection(collection).doc(docId).update({
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
    return true;
  } catch (err) {
    console.error(`更新集合 ${collection} 文档 ${docId} 失败:`, err);
    return false;
  }
};

/**
 * 数据库删除文档
 * @param {string} collection 集合名
 * @param {string} docId 文档ID
 * @returns {Promise<boolean>}
 */
const dbRemove = async (collection, docId) => {
  try {
    const db = wx.cloud.database();
    await db.collection(collection).doc(docId).remove();
    return true;
  } catch (err) {
    console.error(`删除集合 ${collection} 文档 ${docId} 失败:`, err);
    return false;
  }
};

/**
 * 上传文件到云存储
 * @param {string} filePath 本地文件路径
 * @param {string} cloudDir 云存储目录
 * @returns {Promise<string|null>} fileID
 */
const uploadFile = async (filePath, cloudDir = 'uploads') => {
  try {
    const ext = filePath.split('.').pop() || 'jpg';
    const cloudPath = `${cloudDir}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const res = await wx.cloud.uploadFile({
      cloudPath,
      filePath
    });
    return res.fileID;
  } catch (err) {
    console.error('上传文件失败:', err);
    return null;
  }
};

/**
 * 批量上传文件
 * @param {Array<string>} filePaths 本地文件路径数组
 * @param {string} cloudDir 云存储目录
 * @returns {Promise<Array<string>>} fileID数组
 */
const uploadFiles = async (filePaths, cloudDir = 'uploads') => {
  const results = [];
  for (const filePath of filePaths) {
    const fileID = await uploadFile(filePath, cloudDir);
    if (fileID) results.push(fileID);
  }
  return results;
};

module.exports = {
  callFunction,
  dbQuery,
  dbAdd,
  dbUpdate,
  dbRemove,
  uploadFile,
  uploadFiles
};