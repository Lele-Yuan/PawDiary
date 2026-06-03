const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 生成小程序码（DGTI 分享海报使用）
// event: { page, scene }
exports.main = async (event, context) => {
  const page = event.page || 'pages/dogti/index/index';
  const scene = event.scene || 'dgti';
  try {
    const result = await cloud.openapi.wxacode.getUnlimited({
      scene: scene,
      page: page,
      checkPath: false,
      envVersion: 'trial', // develop / trial / release
      width: 280,
      autoColor: false,
      lineColor: { r: 119, g: 50, b: 28 },
      isHyaline: false,
    });

    if (result.errCode === 0 && result.buffer) {
      // 上传到云存储，返回 cloud:// 路径
      const upload = await cloud.uploadFile({
        cloudPath: `dgti/wxacode/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`,
        fileContent: result.buffer,
      });
      return { code: 0, fileID: upload.fileID };
    }
    return { code: -1, msg: 'getUnlimited failed', errCode: result.errCode };
  } catch (err) {
    return { code: -1, msg: err.message || 'error', errStack: err.stack };
  }
};
