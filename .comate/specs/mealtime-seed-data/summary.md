# 来我家吃饭（mealtime）食材与口味基础数据补全总结

## 问题原因

菜品编辑页「选择食材 / 口味」为空，并非代码缺陷，而是云数据库集合 `meal_ingredients` / `meal_tastes` 没有数据，上线步骤中的「调用 `base.seed` 初始化基础库」尚未执行。

## 完成内容

扩充了内置基础数据并提供可直接导入的文件，3 个任务全部完成。

数据规模：食材 66 种，按蔬菜豆制品、肉类、水产海鲜、蛋奶、主食、调料分类编排 sort（分类段 10/40/50/60/70/80），均带 emoji；口味 14 种（酸甜苦辣咸鲜麻香、清淡、重口、蒜香、孜然、糖醋、五香）。

改动文件：
- `cloudfunctions/mealManage/index.js`：`INGREDIENTS`、`TASTES` 扩充为上述数据，`seedBaseData`（先清空再写入）逻辑不变。
- 新增 `.comate/specs/mealtime-seed-data/meal_ingredients.json`（66 行，JSON Lines，不含 _id）。
- 新增 `.comate/specs/mealtime-seed-data/meal_tastes.json`（14 行，JSON Lines，不含 _id）。

## 验证

`node --check` 云函数通过；代码内食材 66、口味 14；两份 JSON Lines 文件逐行 JSON.parse 校验通过（66 / 14 条）。

## 落库方式（二选一，数据一致）

路径一（推荐）：微信开发者工具右键 `cloudfunctions/mealManage` → 上传并部署；在云开发控制台对该云函数「云端测试」，event 传 `{"action":"base.seed"}`，自动清空并写入两个集合。返回示例：`已初始化 66 种食材、14 种口味`。

路径二（控制台导入）：云开发控制台 → 数据库 → 选择 `meal_ingredients` 集合 → 导入 → 选择 `meal_ingredients.json`（冲突处理一般选 insert）；对 `meal_tastes` 集合导入 `meal_tastes.json`。导入前若集合已有数据，建议先清空以免重复。

完成后重新进入菜品编辑页，「选择食材 / 口味」即显示分类齐全的可选项。
