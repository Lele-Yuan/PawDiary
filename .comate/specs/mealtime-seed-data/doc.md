# 来我家吃饭（mealtime）食材与口味基础数据补全设计

## 一、需求与问题定位

菜品编辑页「选择食材 / 口味」无数据。排查：dishEdit 通过 `api.base.ingredients()` / `api.base.tastes()` 调用 `mealManage` 的 `dish.ingredients` / `dish.tastes`，分别读取云数据库集合 `meal_ingredients` / `meal_tastes`（按 sort 升序）。两个集合当前为空，是因为上线步骤中的「调用 `base.seed` 初始化基础库」尚未执行，集合里没有任何记录。

本次目标：提供一份更丰富、分类清晰的食材与口味数据，并让其进入云开发数据库，使选择面板有内容。

## 二、现状数据

`cloudfunctions/mealManage/index.js` 的 `seedBaseData` 当前内置约 29 种食材、7 种口味，字段：食材 `{name, emoji, category, sort}`、口味 `{name, emoji, sort}`，写入 `meal_ingredients` / `meal_tastes`。本次在此基础上扩充。

## 三、数据方案（扩充后）

食材按分类组织，sort 以「分类段 + 段内序」编排（蔬菜 1x、肉类 2x、水产 3x、蛋奶 4x、主食 5x、调料 6x），便于面板分组展示：

- 蔬菜豆制品（约 22 种）：番茄、青菜、土豆、茄子、青椒、玉米、西兰花、胡萝卜、黄瓜、蘑菇、洋葱、菠菜、白菜、生菜、豆角、冬瓜、南瓜、莲藕、芹菜、韭菜、豆腐、山药等。
- 肉类（约 10 种）：鸡肉、猪肉、牛肉、羊肉、鸭肉、培根、香肠、排骨、鸡翅、肉丸。
- 水产海鲜（约 8 种）：虾、鱼、螃蟹、鱿鱼、蛤蜊、扇贝、龙虾、带鱼。
- 蛋奶（约 5 种）：鸡蛋、牛奶、奶酪、黄油、酸奶。
- 主食（约 8 种）：米饭、面条、面包、饺子、馒头、粥、年糕、米粉。
- 调料（约 13 种）：盐、酱油、食用油、大蒜、生姜、小葱、醋、糖、蚝油、辣椒油、花椒、八角、料酒。

合计约 66 种食材。

口味（约 14 种）：酸、甜、苦、辣、咸、鲜、麻、香、清淡、重口、蒜香、孜然、糖醋、五香。

每条均含 emoji；无专属 emoji 的以相近食物/符号表示。

## 四、交付与落库方式

无法从本地直接写入微信云数据库，因此提供两条等价落库路径，数据完全一致：

路径一（推荐，改代码后一键）：把扩充后的数组写回 `cloudfunctions/mealManage/index.js` 的 `INGREDIENTS` / `TASTES`，重新部署 `mealManage`，在云开发控制台对云函数发起测试调用 `{"action":"base.seed"}`，即自动清空并写入 `meal_ingredients` / `meal_tastes`。

路径二（控制台导入）：另生成两份 JSON Lines 导入文件（每行一个 JSON 记录、不含 \_id），放在本 spec 目录下，供在云开发控制台「数据库 → 对应集合 → 导入」直接导入。

## 五、受影响文件

- 修改 `cloudfunctions/mealManage/index.js`（扩充 INGREDIENTS / TASTES；`seedBaseData` 逻辑不变）
- 新增 `.comate/specs/mealtime-seed-data/meal_ingredients.json`（导入用，JSON Lines）
- 新增 `.comate/specs/mealtime-seed-data/meal_tastes.json`（导入用，JSON Lines）

不改动页面、api 与数据结构；`seedBaseData` 为「先清空再写入」，重复执行不会产生重复数据。

## 六、边界与预期

- `base.seed` 会先清空两个集合再写入，若后续有人工追加的基础数据会被覆盖（符合「重置基础库」语义）。
- 路径二导入前如集合已有数据，需自行决定是否先清空，避免重复。
- 完成后菜品编辑页「选择食材 / 口味」即有分类齐全的可选项。
