const { showLoading, hideLoading, showSuccess, showError } = require('../../utils/util');

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    avatarUrl: {
      type: String,
      value: ''
    },
    nickName: {
      type: String,
      value: ''
    },
    phone: {
      type: String,
      value: ''
    }
  },

  data: {
    tempAvatarUrl: '',
    tempNickName: '',
    tempPhone: ''
  },

  observers: {
    'show': function(newVal) {
      if (newVal) {
        // 打开弹窗时，初始化临时数据
        this.setData({
          tempAvatarUrl: this.properties.avatarUrl,
          tempNickName: this.properties.nickName,
          tempPhone: this.properties.phone
        });
      }
    }
  },

  methods: {
    // 关闭登录弹窗
    closeLoginModal() {
      this.triggerEvent('close');
    },

    // 选择头像
    onChooseAvatar(e) {
      this.setData({ tempAvatarUrl: e.detail.avatarUrl });
    },

    // 昵称输入
    onNicknameInput(e) {
      this.setData({ tempNickName: e.detail.value });
    },

    // 获取手机号
    async onGetPhoneNumber(e) {
      if (e.detail.errMsg !== 'getPhoneNumber:ok') return;
      try {
        const res = await wx.cloud.callFunction({
          name: 'userManage',
          data: { action: 'getPhoneNumber', data: { code: e.detail.code } }
        });
        if (res.result && res.result.code === 0) {
          this.setData({ tempPhone: res.result.data.purePhoneNumber || res.result.data.phoneNumber });
          showSuccess('手机号已获取');
        } else {
          showError('获取手机号失败');
        }
      } catch (err) {
        console.error('获取手机号失败：', err);
        showError('获取手机号失败');
      }
    },

    // 确认登录
    async confirmLogin() {
      const { tempAvatarUrl, tempNickName, tempPhone } = this.data;
      if (!tempNickName || !tempNickName.trim()) {
        wx.showToast({ title: '请输入昵称', icon: 'none' });
        return;
      }

      showLoading('登录中...');
      try {
        const app = getApp();
        const db = wx.cloud.database();

        // 上传头像到云存储
        let avatarUrl = tempAvatarUrl;
        if (tempAvatarUrl && (tempAvatarUrl.startsWith('http://tmp') || tempAvatarUrl.startsWith('wxfile://'))) {
          // 大小校验
          const fileStat = await new Promise((resolve) => {
            wx.getFileInfo({ filePath: tempAvatarUrl, success: resolve, fail: () => resolve({ size: 0 }) });
          });
          if (fileStat.size > 500 * 1024) {
            hideLoading();
            showError('头像图片超过500KB，请选择更小的图片');
            return;
          }
          const ext = tempAvatarUrl.includes('.') ? tempAvatarUrl.split('.').pop().split('?')[0] : 'jpg';
          const cloudPath = `avatars/${app.globalData.openid}_${Date.now()}.${ext}`;
          const uploadRes = await wx.cloud.uploadFile({
            cloudPath,
            filePath: tempAvatarUrl
          });
          avatarUrl = uploadRes.fileID;
        }

        // 更新数据库
        const { data: users } = await db.collection('users')
          .where({ _openid: app.globalData.openid })
          .limit(1)
          .get();

        const updateData = {
          nickName: tempNickName.trim(),
          updatedAt: new Date()
        };
        // 只在上传新头像时更新 avatarUrl
        if (tempAvatarUrl && (tempAvatarUrl.startsWith('http://tmp') || tempAvatarUrl.startsWith('wxfile://'))) {
          updateData.avatarUrl = avatarUrl;
        } else if (users.length > 0 && users[0].avatarUrl) {
          // 保持原有头像不变
          updateData.avatarUrl = users[0].avatarUrl;
        } else {
          updateData.avatarUrl = '';
        }
        if (tempPhone) updateData.phone = tempPhone;

        if (users.length > 0) {
          await db.collection('users').doc(users[0]._id).update({ data: updateData });
        }

        // 更新全局状态
        const userInfo = { ...app.globalData.userInfo, ...updateData };
        app.globalData.userInfo = userInfo;

        hideLoading();

        // 向父页面发送登录成功事件
        this.triggerEvent('success', {
          avatarUrl: updateData.avatarUrl,
          nickName: updateData.nickName,
          phone: updateData.phone || ''
        });

        // 关闭弹窗
        this.triggerEvent('close');
      } catch (err) {
        hideLoading();
        console.error('登录失败：', err);
        showError('登录失败');
      }
    }
  }
});
