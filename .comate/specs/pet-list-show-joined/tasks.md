# 我的毛孩子模块显示创建和加入的宠物

- [x] Task 1: 改造 petManage 云函数的 list action，返回创建和加入的宠物并附带 role 字段
    - 1.1: 查询自己创建的活跃宠物
    - 1.2: 查询 pet_members 获取角色映射和加入的宠物 ID
    - 1.3: 为自有宠物标记角色，补建缺失的 creator 记录
    - 1.4: 查询加入但非自己创建的宠物并标记角色
    - 1.5: 合并两个列表返回

- [x] Task 2: 修改 profile.js 的 loadPets() 和 goMyPets() 改为调用云函数
    - 2.1: loadPets() 改为调用 petManage 云函数 list action
    - 2.2: goMyPets() 同理改为调用云函数

- [x] Task 3: 修改 profile.wxml 添加角色标签区分创建和加入的宠物
    - 3.1: 宠物名字旁添加 pet-card-name-row 容器和角色标签
    - 3.2: 仅对 member 角色显示"已加入"标签

- [x] Task 4: 添加角色标签样式到 profile.wxss
    - 4.1: 添加 pet-card-name-row 和 pet-role-tag 相关样式

- [x] Task 5: 修改 home.js 的 loadData() 改为调用云函数获取宠物列表
    - 5.1: 将客户端查库逻辑替换为调用 petManage 云函数 list action
    - 5.2: 保留 currentPetId 选中、角色判断和 roleMap 等现有逻辑
