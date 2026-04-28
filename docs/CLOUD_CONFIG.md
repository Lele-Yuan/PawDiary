# 云数据库配置说明

## app_config 集合

该集合用于存储小程序的全局配置项，可在云开发控制台动态修改。

### 数据结构

```json
{
  "_id": "主键ID（建议使用唯一标识）",
  "quickEntryCare": {
    "enabled": true
  },
  "quickEntryVisit": {
    "enabled": true
  }
}
```

### 配置项说明

| 字段 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| quickEntryCare.enabled | Boolean | 是否显示首页"代铲屎遛狗"快捷入口 | true |
| quickEntryVisit.enabled | Boolean | 是否显示首页"上门沟通"快捷入口 | true |

### 推荐配置数据

```json
{
  "_id": "config_v1",
  "quickEntryCare": {
    "enabled": true
  },
  "quickEntryVisit": {
    "enabled": true
  }
}
```

### 使用方式

1. 在微信开发者工具中打开云开发控制台
2. 进入"数据库" → "app_config" 集合（需要先创建集合）
3. 添加一条记录，按照上面的数据结构填写
4. 修改 `enabled` 为 `false` 可隐藏对应入口
   - `quickEntryCare.enabled`: 控制首页"代铲屎遛狗"入口
   - `quickEntryVisit.enabled`: 控制首页"上门沟通"入口

### 注意事项

- 配置缓存时间为 5 分钟，修改后最多等待 5 分钟生效
- 如果集合中没有配置记录，系统会使用默认配置（默认开启所有入口）
- 前端通过云数据库读取配置，无需重新发布小程序即可生效