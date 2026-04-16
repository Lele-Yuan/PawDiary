# 资源限额功能任务计划

- [x] Task 1: 新建限额工具模块 `miniprogram/utils/limit.js`
    - 1.1: 定义常量 DAILY_STATS_KEY、MAX_PHOTO_SIZE、MAX_DAILY_PHOTOS、MAX_DAILY_PETS、MAX_DAILY_PLACES、MAX_PHOTOS_PER_DETAIL
    - 1.2: 实现 `getDailyStats()` — 读取本地存储，跨天自动重置
    - 1.3: 实现 `checkPhotoLimit(count)` — 检查当日照片余量，返回 `{ ok, remaining }`
    - 1.4: 实现 `incrementPhotoCount(count)` — 上传成功后递增照片计数
    - 1.5: 实现 `checkPetLimit()` / `incrementPetCount()` — 宠物每日限额
    - 1.6: 实现 `checkPlaceLimit()` / `incrementPlaceCount()` — 地点每日限额
    - 1.7: 实现 `checkImageSize(tempFiles)` — 过滤超过500KB的文件，返回 `{ validFiles, oversizedCount }`
    - 1.8: 导出所有函数

- [x] Task 2: 修改 `record-add.js` — 记录照片限额
    - 2.1: 引入 limit.js 工具函数
    - 2.2: `chooseImage()` 中调用 `checkImageSize` 过滤超大文件并 toast 提示
    - 2.3: `chooseImage()` 中用 `checkPhotoLimit` 计算可选数量上限，每日已满则直接拦截
    - 2.4: 单条详情最大图片数从 9 改为 5（`count: remaining`、`.slice(0,5)`、toast 文案）
    - 2.5: `onSubmit()` 上传前再次校验 `checkPhotoLimit`，上传成功后调用 `incrementPhotoCount`

- [x] Task 3: 修改 `place-add.js` — 地点照片与地点新增限额
    - 3.1: 引入 limit.js 工具函数
    - 3.2: `chooseImage()` 中调用 `checkImageSize` 过滤超大文件并 toast 提示
    - 3.3: `chooseImage()` 中用 `checkPhotoLimit` 计算可选数量上限，每日已满则拦截
    - 3.4: 单条地点最大图片数从 3 改为 5（上限判断、toast 文案）
    - 3.5: `onSubmit()` 新增模式下校验 `checkPlaceLimit()`，超限时 toast 提示并返回
    - 3.6: `onSubmit()` 新增图片上传成功后调用 `incrementPhotoCount`，新增地点成功后调用 `incrementPlaceCount`

- [x] Task 4: 修改 `pet-edit.js` — 宠物新增每日限额 + 头像大小校验
    - 4.1: 引入 limit.js 工具函数
    - 4.2: `chooseAvatar()` 中调用 `checkImageSize` 校验头像文件大小，超限时 toast 提示并忽略
    - 4.3: `onSubmit()` 新增模式下校验 `checkPetLimit()`，超限时 toast 提示并返回
    - 4.4: `onSubmit()` 新增宠物成功后调用 `incrementPetCount()`

- [x] Task 5: 修改 `memorial-add.js` 和 `profile.js` — 头像大小校验
    - 5.1: `memorial-add.js` `chooseAvatar()` 中增加500KB大小校验，超限时 toast 提示并忽略
    - 5.2: `profile.js` 上传头像前增加500KB大小校验，超限时 toast 提示并中止上传
