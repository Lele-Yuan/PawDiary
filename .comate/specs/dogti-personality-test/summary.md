# DGTI 狗格测试 - 实现总结

## 完成内容

### 新建文件（13个）

| 文件 | 说明 |
|---|---|
| `pages/dogti/data/dgti-data.js` | 核心数据层：15维度 + 16狗格 + 24题目 + 算分逻辑 |
| `pages/dogti/index/index.{wxml,js,wxss,json}` | 首页：Hero扫描卡 + CTA + 横向滚动卡片 + 5大模型 |
| `pages/dogti/test/test.{wxml,js,wxss,json}` | 答题页：进度条 + 一题一卡 + 自动跳题 |
| `pages/dogti/result/result.{wxml,js,wxss,json}` | 结果页：DNA分析 + 特征 + 分享卡 |

### 修改文件（3个）

| 文件 | 修改内容 |
|---|---|
| `miniprogram/app.json` | 新增3条路由 |
| `miniprogram/pages/profile/profile.wxml` | DGTI按钮添加 `bindtap="goDgti"` |
| `miniprogram/pages/profile/profile.js` | 新增 `goDgti()` 跳转方法 |

## 产品核心设计

### 算法
- **15个维度**（E/I/A、F/S/M、C/G/D、P/Z/T、R/B/H）覆盖5大模型
- **24道题目**，每题4选项，答案携带维度权重得分
- 答完后对5个模型各取最高维度，前3主维度组合精确匹配16种狗格
- 无精确匹配时降级为最大重叠度匹配，保证100%有结果

### 体验流程
```
profile页DGTI按钮 → 首页(研究所) → 答题页(24题) → 结果页
                                    ↑
                           首页「立即检测狗格」
```

### 视觉风格
参考设计稿，使用暖棕色系设计 token：主色 `#77321C`、背景 `#FFF8F6`、卡片 `#FFF1ED`、绿色 `#CFE99F`，全程圆角卡片风格。
