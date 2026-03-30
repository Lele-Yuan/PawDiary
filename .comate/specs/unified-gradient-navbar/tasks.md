# 全局统一自定义渐变导航栏任务清单

- [x] Task 1: 更新 nav-bar 组件为渐变样式
    - 1.1: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/components/nav-bar/nav-bar.wxss`，将背景色替换为 `linear-gradient(135deg, #C8BFFF 0%, #A8C8FF 100%)`
    - 1.2: 将 `.back-icon` 和 `.nav-bar-title` 的颜色从 `#FFFFFF` 改为 `#2D2D2D`

- [x] Task 2: 更新 app.json 全局原生导航颜色
    - 2.1: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/app.json`，将 `navigationBarBackgroundColor` 更新为 `#C8BFFF`，与渐变主色调保持一致

- [x] Task 3: 清单页切换为自定义导航栏
    - 3.1: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/checklist/checklist.json`，新增 `"navigationStyle": "custom"` 并注册 nav-bar 组件
    - 3.2: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/checklist/checklist.wxml`，在根容器首行插入 `<nav-bar title="清单" />`

- [x] Task 4: 健康记录页切换为自定义导航栏
    - 4.1: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/record/record.json`，新增 `"navigationStyle": "custom"` 并注册 nav-bar 组件
    - 4.2: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/record/record.wxml`，在根容器首行插入 `<nav-bar title="健康记录" />`

- [x] Task 5: 账单页切换为自定义导航栏
    - 5.1: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/bill/bill.json`，新增 `"navigationStyle": "custom"` 并注册 nav-bar 组件
    - 5.2: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/bill/bill.wxml`，在根容器首行插入 `<nav-bar title="账单" />`

- [x] Task 6: 我的页切换为自定义导航栏
    - 6.1: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/profile/profile.json`，新增 `"navigationStyle": "custom"` 并注册 nav-bar 组件
    - 6.2: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/pages/profile/profile.wxml`，在根容器首行插入 `<nav-bar title="我的" />`

- [x] Task 7: 回归检查
    - 7.1: 复查上述所有改动文件，确认结构与配置无误
    - 7.2: 对相关 JS 文件执行语法检查，确认无报错
