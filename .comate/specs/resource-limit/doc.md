# 资源限额功能设计文档

## 需求背景

为防止云存储和数据库资源过量消耗，对上传照片大小、每日操作次数及单条详情照片数量进行约束。

---

## 限额规则汇总

| 限额类型 | 规则 | 当前状态 |
|---|---|---|
| 单张照片大小 | ≤ 500KB | 无限制 |
| 每日上传照片总数 | ≤ 5 张/天（含记录、地点所有场景） | 无限制 |
| 每日新增宠物 | ≤ 2 个/天 | 无限制 |
| 每日新增地点 | ≤ 2 个/天 | 无限制 |
| 单条详情最多照片数 | ≤ 5 张/条（记录/地点） | 记录9张、地点3张 |

> 头像上传（宠物头像、用户头像、纪念馆头像）仅做大小校验，不计入每日上传照片数量。

---

## 技术方案

### 存储策略

采用 **`wx.getStorageSync` / `wx.setStorageSync`** 本地存储维护每日计数，结构如下：

```js
// key: 'pawdiary_daily_stats'
{
  date: '2026-04-04',   // 当天日期 YYYY-MM-DD，跨天自动重置
  photoCount: 0,        // 当日已上传照片数
  petCount: 0,          // 当日已新增宠物数
  placeCount: 0         // 当日已新增地点数
}
```

说明：
- 每次读取时比较 `date` 与当天日期，不一致则自动重置为零
- 计数在**提交成功后**才递增（避免因上传失败导致误计）
- 采用本地存储而非云端，避免增加额外云函数调用开销，满足防误用场景

### 照片大小校验策略

`wx.chooseMedia` 回调的 `tempFiles` 中包含 `size` 字段（单位：字节）。在 `chooseImage` / `chooseAvatar` 回调中过滤超大文件：

```js
const MAX_SIZE = 500 * 1024; // 500KB
const oversized = res.tempFiles.filter(f => f.size > MAX_SIZE);
if (oversized.length > 0) {
  wx.showToast({ title: `${oversized.length}张图片超过500KB，已自动过滤`, icon: 'none' });
}
const validFiles = res.tempFiles.filter(f => f.size <= MAX_SIZE);
```

---

## 受影响文件及修改说明

### 1. 新建 `miniprogram/utils/limit.js`（新建）

封装所有限额操作，暴露以下函数：

```js
// 获取今日统计（跨天自动重置）
function getDailyStats() { ... }

// 检查今日照片上传是否还有余量（count 为本次待上传数量）
// 返回 { ok: boolean, remaining: number }
function checkPhotoLimit(count) { ... }

// 提交成功后增加照片计数
function incrementPhotoCount(count) { ... }

// 检查今日是否还能新增宠物
function checkPetLimit() { ... }

// 提交成功后增加宠物计数
function incrementPetCount() { ... }

// 检查今日是否还能新增地点
function checkPlaceLimit() { ... }

// 提交成功后增加地点计数
function incrementPlaceCount() { ... }
```

### 2. `miniprogram/pages/record/record-add/record-add.js`（修改）

- `chooseImage()`: 增加大小过滤（500KB）；每日照片剩余量控制 `count` 参数；单条上限从 9 改为 5
- `onSubmit()`: 上传成功后调用 `incrementPhotoCount(新增数量)`；上传前用 `checkPhotoLimit` 验证

### 3. `miniprogram/pages/map/place-add/place-add.js`（修改）

- `chooseImage()`: 增加大小过滤（500KB）；单条上限从 3 改为 5；控制每日可选数量
- `onSubmit()`: 仅在**新增**模式下校验 `checkPlaceLimit()` 并在成功后 `incrementPlaceCount()`；上传前验证 `checkPhotoLimit`，成功后 `incrementPhotoCount(新增图片数)`

### 4. `miniprogram/pages/pet-edit/pet-edit.js`（修改）

- `chooseAvatar()`: 增加大小过滤（500KB），仅作展示提示
- `onSubmit()`: 仅在**新增**模式下校验 `checkPetLimit()`，成功后 `incrementPetCount()`

### 5. `miniprogram/pages/memorial/memorial-add/memorial-add.js`（修改）

- `chooseAvatar()`: 增加大小过滤（500KB），超限时提示用户并不设置头像

### 6. `miniprogram/pages/profile/profile.js`（修改）

- 上传前增加文件大小校验（500KB）

---

## 边界条件与异常处理

| 场景 | 处理方式 |
|---|---|
| 选图时所有图片均超过500KB | Toast提示"所选图片均超过500KB限制"，不更新图片列表 |
| 每日照片已满5张 | Toast提示"今日上传照片已达上限（5张）"，不允许选图 |
| 每日宠物已达2个 | Toast提示"今日已达新增宠物上限（2个）"，`onSubmit` 提前返回 |
| 每日地点已达2个 | Toast提示"今日已达新增地点上限（2个）"，`onSubmit` 提前返回 |
| 单条详情已有5张照片 | Toast提示"最多上传5张图片"（已有逻辑，更新数字即可） |
| 照片上传途中失败 | 不增加计数（计数在成功后才递增） |
| 跨天使用 | 读取stats时自动重置为当天零 |

---

## 数据流路径

```
用户操作 chooseImage/chooseAvatar
  → 大小过滤（> 500KB 剔除）
  → 每日余量检查（limit.js）
  → 更新页面图片列表
  → 用户点击提交
  → 每日新增次数检查（宠物/地点，limit.js）
  → 上传到云存储
  → 上传成功 → incrementCount（limit.js）
  → 写入数据库
```

---

## 预期结果

- 所有超过500KB的图片在选择阶段被拦截，给出明确提示
- 每日照片上传超过5张后，相关页面的选图入口提前被拦截
- 每日新增宠物/地点超出限额后，提交操作被拦截
- 单条记录/地点图片数量统一限制为5张
- 所有限额均在客户端本地存储维护，无额外云函数开销
