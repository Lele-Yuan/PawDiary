# 来我家吃饭（mealtime）视觉改版任务计划

- [✓] Task 1: 重写主题 mealtime-theme.wxss（核心）
    - 1.1: 替换 page{} 中 8 个 CSS 变量为珊瑚奶油配色，渐变改珊瑚/暖头图
    - 1.2: 公共类投影绿→珊瑚（.card/.btn/.search-bar）
    - 1.3: .tag.cook/.eat/.admin、.avatar、.chip 配色暖色化（含鼠尾草绿、暖黄点缀）

- [✓] Task 2: 调整各页面 wxss 的硬编码绿色值
    - 2.1: index.wxss（.act-btn 投影、.field 底色）
    - 2.2: family.wxss（.invite 投影）
    - 2.3: menu.wxss（.dish-card/.fab 投影、.dish-img 底色）
    - 2.4: order.wxss（.nav/.bar-btn.ghost 底色、.d-img 底色、.d-item/.pick-btn/.bar 投影）
    - 2.5: receipt.wxss（.ticket 投影、.zigzag 裁切色、.dash 虚线、.rmk 文本）
    - 2.6: members.wxss（.op.mini-op 底色）
    - 2.7: dishEdit.wxss（.up-btn 底色与虚线）

- [✓] Task 3: 调整 8 个页面 json 导航栏颜色
    - 3.1: navigationBarBackgroundColor 由 #8CC63F 改为 #EE7A6D（文字保持白色）

- [✓] Task 4: 自测
    - 4.1: 校验各 wxss/json 语法与 JSON 合法性，确认无残留绿色硬编码值
