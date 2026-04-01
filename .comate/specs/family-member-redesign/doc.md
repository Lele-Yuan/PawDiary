# 家庭成员视觉重构

## 需求场景

将首页家庭成员模块从纵向列表布局改为横向头像行布局，与 Figma 设计稿一致。最多支持显示 5 个家庭成员（含邀请按钮占位）。

## 设计稿分析

Figma 设计稿呈现的视觉要素：

1. **容器**：水平排列，flex-row，成员间距 48rpx（对应设计稿 24px）
2. **成员项**：宽 128rpx，垂直布局（头像 + 名称）
3. **头像**：128rpx 圆形，4rpx 内边距
   - 创建者/当前用户：2px 实线棕色边框 `rgba(149,73,49,1)` 即 `#954931`
   - 其他成员：透明边框，整体 60% 不透明度
4. **名称**：20rpx 加粗，居中
   - 创建者：棕色 `#954931`
   - 其他：深灰 `#313331`
5. **邀请按钮**（末位）：虚线边框 `#B1B2B0`，中间显示加号图标（14px），文字"邀请成员"灰色 `#7A7B79`
6. **上限**：最多 5 个位置（4 个成员 + 1 个邀请按钮）；如果已有 5 个成员则不显示邀请按钮

## 技术方案

### 架构

- 仅修改前端展示层（WXML + WXSS），不涉及 JS 逻辑层和云函数
- 保留原有的管理功能（长按成员弹出操作菜单，替代原来的行内按钮）
- 保留 section-header（标题 + 邀请按钮），但邀请按钮从 header 移到成员行末尾

### 受影响文件

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `miniprogram/pages/home/home.wxml` | 修改 | 重写家庭成员区域 WXML 结构 |
| `miniprogram/pages/home/home.wxss` | 修改 | 重写家庭成员相关样式 |
| `miniprogram/pages/home/home.js` | 修改 | 添加成员管理弹窗逻辑 |

### WXML 结构变更

将 `family-section` 内部重写为：

```html
<!-- 家庭成员 -->
<view class="family-section card" wx:if="{{currentPet}}">
  <view class="section-header">
    <text class="section-title">家庭成员</text>
  </view>
  <view class="family-row">
    <view
      class="family-member {{item.role === 'creator' ? 'family-member-active' : ''}}"
      wx:for="{{familyMembers}}"
      wx:key="_id"
      data-openid="{{item._openid}}"
      data-role="{{item.role}}"
      bindlongpress="onMemberLongPress"
    >
      <view class="family-member-avatar-wrap {{item.role === 'creator' ? 'avatar-border-active' : ''}}">
        <image class="family-member-avatar" src="{{item.avatarUrl || '/images/default-avatar.png'}}" mode="aspectFill" />
      </view>
      <text class="family-member-name {{item.role === 'creator' ? 'name-active' : ''}}">{{item.nickName}}</text>
    </view>
    <!-- 邀请按钮，当成员不足5个且有编辑权限时显示 -->
    <button class="family-member family-member-add" open-type="share" wx:if="{{familyMembers.length < 5 && canEdit}}">
      <view class="family-member-avatar-wrap avatar-border-dashed">+</view>
      <text class="family-member-name name-muted">邀请成员</text>
    </button>
  </view>
</view>
```

### WXSS 样式变更

删除原有 `.family-list`, `.family-item`, `.family-avatar`, `.family-info`, `.family-name`, `.family-role`, `.family-actions`, `.family-action-btn`, `.family-empty` 等样式。

新增样式：

```css
/* 家庭成员横向排列 */
.family-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0 8rpx;
}

.family-member {
  width: 128rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 48rpx;
  opacity: 0.6;
  background: none;
  border: none;
  padding: 0;
  line-height: normal;
}
.family-member::after { border: none; }
.family-member:last-child { margin-right: 0; }

.family-member-active {
  opacity: 1;
}

.family-member-avatar-wrap {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  border: 4rpx solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
  box-sizing: border-box;
  overflow: hidden;
}

.avatar-border-active {
  border-color: #954931;
}

.avatar-border-dashed {
  border: 4rpx dashed #B1B2B0;
}

.family-member-avatar {
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
}

.family-member-name {
  font-size: 20rpx;
  font-weight: 700;
  color: #313331;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 128rpx;
}

.name-active {
  color: #954931;
}

.name-muted {
  color: #7A7B79;
}

.family-add-icon {
  width: 28rpx;
  height: 28rpx;
}

.family-member-add {
  opacity: 1;
}
```

### JS 逻辑变更

添加 `onMemberLongPress` 方法，创建者长按非创建者成员时弹出 ActionSheet：

```javascript
onMemberLongPress: function(e) {
  if (!this.data.isCreator) return;
  var openid = e.currentTarget.dataset.openid;
  var role = e.currentTarget.dataset.role;
  if (role === 'creator') return;

  var items = [role === 'admin' ? '取消管理员' : '设为管理员', '移除成员'];
  var that = this;
  wx.showActionSheet({
    itemList: items,
    success: function(res) {
      if (res.tapIndex === 0) {
        that.toggleMemberRole(openid, role);
      } else if (res.tapIndex === 1) {
        that.removeMember(openid);
      }
    }
  });
}
```

将原 `onToggleRole` 和 `onRemoveMember` 逻辑提取到 `toggleMemberRole(openid, role)` 和 `removeMember(openid)` 方法中（去除事件参数依赖）。

### 边界条件

- 成员数量 = 0（理论上至少有创建者）：显示空提示
- 成员数量 >= 5：隐藏邀请按钮
- 成员名称过长：ellipsis 截断，最大宽度 128rpx
- 非编辑权限：不显示邀请按钮
- 非创建者：长按无响应

### 预期结果

家庭成员区域呈现为横向头像行，创建者头像有棕色边框且名称棕色、完全不透明；其他成员 60% 透明度；末尾为虚线边框的邀请按钮。最多 5 个位置。
