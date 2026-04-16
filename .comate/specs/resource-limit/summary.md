# 资源限额功能实现总结

## 完成情况

所有 5 个任务均已完成。

---

## 新增文件

### `miniprogram/utils/limit.js`
资源限额统一工具模块，基于 `wx.getStorageSync/setStorageSync` 本地存储维护每日计数，跨天自动重置。

暴露接口：
- `checkPhotoLimit(count)` / `incrementPhotoCount(count)` — 每日照片上传限额
- `checkPetLimit()` / `incrementPetCount()` — 每日新增宠物限额
- `checkPlaceLimit()` / `incrementPlaceCount()` — 每日新增地点限额
- `checkImageSize(tempFiles)` — 过滤超过 500KB 的文件
- `MAX_PHOTOS_PER_DETAIL` — 单条详情最大图片数常量（5）

---

## 修改文件

| 文件 | 改动内容 |
|---|---|
| `pages/record/record-add/record-add.js` | `chooseImage`：大小过滤 + 每日余量控制 + 单条上限 9→5；`onSubmit`：提前校验日限额，上传成功后递增计数 |
| `pages/map/place-add/place-add.js` | `chooseImage`：大小过滤 + 每日余量控制 + 单条上限 3→5；`onSubmit`：新增模式校验地点日限额 + 上传成功后递增照片/地点计数 |
| `pages/pet-edit/pet-edit.js` | `chooseAvatar`：头像 500KB 大小校验；`onSubmit`：新增模式校验宠物日限额，成功后递增计数 |
| `pages/memorial/memorial-add/memorial-add.js` | `chooseAvatar`：头像 500KB 大小校验 |
| `pages/profile/profile.js` | `confirmLogin`：上传头像前通过 `wx.getFileInfo` 校验大小，超限提示并中止上传 |

---

## 限额规则生效逻辑

```
选择图片时
  → 检查单条详情已达5张？→ 拦截
  → 检查今日照片余量为0？→ 拦截
  → wx.chooseMedia 最多只允许选"余量"张
  → checkImageSize 过滤超过500KB的文件 → toast 提示

提交时（新增模式）
  → 检查宠物/地点日限额 → 超限则拦截返回
  → 检查照片日限额（二次保险）
  → 上传成功 → incrementPhotoCount / incrementPetCount / incrementPlaceCount
```

---

## 注意事项

- 所有计数存储于客户端本地，清除缓存（`profile.js clearCache`）会重置限额，属预期行为
- 编辑模式不受宠物/地点日新增限额约束，仅新增模式受限
- 头像上传（宠物/用户/纪念馆）不计入每日照片数量，仅做大小校验
