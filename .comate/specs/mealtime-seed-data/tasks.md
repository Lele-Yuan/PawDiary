# 来我家吃饭（mealtime）食材与口味基础数据补全任务计划

- [✓] Task 1: 扩充云函数内置基础数据
    - 1.1: 用约 66 种食材（蔬菜/肉类/水产/蛋奶/主食/调料分类，带 emoji 与 sort）替换 index.js 的 INGREDIENTS
    - 1.2: 用约 14 种口味替换 index.js 的 TASTES
    - 1.3: 确认 seedBaseData 清空再写入逻辑不变

- [✓] Task 2: 生成控制台导入文件（JSON Lines，不含 _id）
    - 2.1: 新增 .comate/specs/mealtime-seed-data/meal_ingredients.json
    - 2.2: 新增 .comate/specs/mealtime-seed-data/meal_tastes.json

- [✓] Task 3: 自测与落库说明
    - 3.1: node --check 云函数，校验导入文件每行 JSON 合法
    - 3.2: 在 summary.md 给出两条落库路径（部署后调用 base.seed / 控制台导入）
