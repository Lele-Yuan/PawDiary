// DGTI 狗格测试 - 五大人格轴版本
// 5 大对立轴 → 5 维雷达 → 16 名著人格软匹配

// ===== 5 大对立轴定义 =====
// 每轴归一化为 0-100，>50 偏正极，<50 偏反极
const AXES = [
  { key: 'social',   posKey: 'S', negKey: 'O', posLabel: '社牛', negLabel: '观察', radarLabel: '社交能力' },
  { key: 'clingy',   posKey: 'M', negKey: 'I', posLabel: '黏人', negLabel: '独立', radarLabel: '依赖指数' },
  { key: 'action',   posKey: 'A', negKey: 'H', posLabel: '冲动', negLabel: '稳健', radarLabel: '行动力' },
  { key: 'strategy', posKey: 'P', negKey: 'E', posLabel: '策略', negLabel: '执行', radarLabel: '策略值' },
  { key: 'freedom',  posKey: 'F', negKey: 'R', posLabel: '自由', negLabel: '秩序', radarLabel: '自由度' },
];

// ===== 16 个狗格人格 =====
// match: 软匹配条件数组，op ∈ {'>', '<'}
const PERSONALITIES = [
  {
    id: 'qi-tian', name: '齐天疯狗型', subtitle: '孙悟空系', code: 'S+A+F',
    identity: '精神状态遥遥领先', tagline: '它不是在发疯，它是在修仙。',
    rarity: 'SSR', rarityColor: '#77321C', rarityBg: '#CFE99F', iconBg: '#CFE99F',
    traits: ['半夜跑酷', '永远坐不住', '精力核爆', '越管越疯'],
    behaviors: ['客厅大闹天宫', '五分钟拆一个玩具', '情绪像过山车'],
    breeds: ['哈士奇', '柴犬', '澳洲牧羊犬'], job: '极限运动员', soulRank: 'S-Tier Chaotic',
    social: 90, danger: 85, destroy: 99, clingy: 30, mental: 5,
    tags: ['狂暴之源', '传送门大师'],
    trait1Title: 'Energy Nuke（能量核爆）',
    trait1Desc: '跑在永动机上。进公园不是散步，是开疆拓土。睡觉只是充电暂停。',
    trait1Color: '#B6D088',
    trait2Title: 'Chaos Engine（混乱引擎）',
    trait2Desc: '在没有任何预兆的情况下，以0.3秒完成从"乖"到"发疯"的切换。',
    trait2Color: '#FFB59E',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_01.png',
    match: [
      { axis: 'social', op: '>', threshold: 70 },
      { axis: 'action', op: '>', threshold: 80 },
      { axis: 'freedom', op: '>', threshold: 70 },
    ],
  },
  {
    id: 'kong-ming', name: '孔明军师型', subtitle: '诸葛亮系', code: 'O+P+R',
    identity: '全家战略指挥官', tagline: '它已经开始复盘你的失误了。',
    rarity: 'SSR', rarityColor: '#54662E', rarityBg: '#CFE99F', iconBg: '#D3C5AD',
    traits: ['高智商', '观察力恐怖', '喜欢管理别人', '会套路主人'],
    behaviors: ['偷偷布局', '精准骗零食', '指挥全家行动'],
    breeds: ['边牧', '杜宾', '德牧'], job: '战略顾问', soulRank: 'S-Tier Strategist',
    social: 60, danger: 40, destroy: 30, clingy: 70, mental: 95,
    tags: ['智商压制', '零食骗局'],
    trait1Title: 'Master Plan（大局为先）',
    trait1Desc: '每天清晨规划你的失误，每天夜晚等待你犯错。它早已看穿一切。',
    trait1Color: '#B6D088',
    trait2Title: 'Snack Trap（零食陷阱）',
    trait2Desc: '装出最无辜的眼神，在你毫无防备时精准出击，零食到手率99%。',
    trait2Color: '#FFB59E',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_02.png',
    match: [
      { axis: 'social', op: '<', threshold: 40 },
      { axis: 'strategy', op: '>', threshold: 80 },
      { axis: 'freedom', op: '<', threshold: 40 },
    ],
  },
  {
    id: 'dai-yu', name: '黛玉敏感型', subtitle: '林黛玉系', code: 'O+M+A',
    identity: '玻璃心情绪艺术家', tagline: '它不是脆弱，它只是情绪细腻。',
    rarity: 'SR', rarityColor: '#77321C', rarityBg: '#F0E0C8', iconBg: '#FFF1ED',
    traits: ['超级敏感', '情绪波动大', '黏人', '容易委屈'],
    behaviors: ['你语气不对它都知道', '被忽略会emo', '喜欢贴贴'],
    breeds: ['比熊', '博美', '小体贵宾'], job: '情绪感知师', soulRank: 'A-Tier Sensitive',
    social: 55, danger: 20, destroy: 25, clingy: 98, mental: 40,
    tags: ['玻璃心', '贴贴专家'],
    trait1Title: 'Heart Radar（情绪雷达）',
    trait1Desc: '能在你叹气0.5秒内感知到你的情绪波动，并立刻展开安慰行动。',
    trait1Color: '#FFB59E',
    trait2Title: 'Drama Tear（委屈珍珠）',
    trait2Desc: '被轻微忽视后，可持续释放"委屈光环"长达30分钟，直到获得充分安抚。',
    trait2Color: '#B6D088',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_03.png',
    match: [
      { axis: 'social', op: '<', threshold: 40 },
      { axis: 'clingy', op: '>', threshold: 80 },
      { axis: 'action', op: '>', threshold: 70 },
    ],
  },
  {
    id: 'bao-yu', name: '宝玉摆烂型', subtitle: '贾宝玉系', code: 'F+H+M',
    identity: '快乐废物哲学家', tagline: '狗生这么短，何必上班。',
    rarity: 'SR', rarityColor: '#54662E', rarityBg: '#CFE99F', iconBg: '#CFE99F',
    traits: ['能躺绝不站', '喜欢享受', '温柔', '不爱竞争'],
    behaviors: ['晒太阳一下午', '对世界毫无攻击性', '吃完就睡'],
    breeds: ['金毛', '拉布拉多', '柯基'], job: '首席躺平官', soulRank: 'B-Tier Zen Master',
    social: 75, danger: 5, destroy: 15, clingy: 85, mental: 80,
    tags: ['摆烂哲学家', '温柔系'],
    trait1Title: 'Golden Sloth（黄金懒虫）',
    trait1Desc: '找到任何一块阳光，可以不动长达4小时，并在此期间保持完美的幸福感。',
    trait1Color: '#B6D088',
    trait2Title: 'Peace Vibes（和平光环）',
    trait2Desc: '对任何冲突毫无兴趣。路遇吵架自动绕道，世界和平靠它守护。',
    trait2Color: '#D3C5AD',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_04.png',
    match: [
      { axis: 'freedom', op: '>', threshold: 80 },
      { axis: 'action', op: '<', threshold: 40 },
      { axis: 'clingy', op: '>', threshold: 60 },
    ],
  },
  {
    id: 'wu-song', name: '武松战神型', subtitle: '水浒系', code: 'O+A+E',
    identity: '家门口第一保镖', tagline: '这个家，得靠它镇场子。',
    rarity: 'SSR', rarityColor: '#77321C', rarityBg: '#FFB59E', iconBg: '#FFB59E',
    traits: ['战斗欲强', '领地意识爆棚', '护主'],
    behaviors: ['快递员宿敌', '觉得全世界危险', '随时准备开战'],
    breeds: ['罗威纳', '德牧', '杜宾'], job: '保镖队长', soulRank: 'S-Tier Guardian',
    social: 30, danger: 95, destroy: 70, clingy: 60, mental: 55,
    tags: ['领地守卫', '快递员克星'],
    trait1Title: 'Territory Lock（领地锁定）',
    trait1Desc: '半径50米内所有异动，均在监控之下。入侵者将在0.1秒内被识别并响应。',
    trait1Color: '#FFB59E',
    trait2Title: 'Loyal Core（忠诚内核）',
    trait2Desc: '凶猛表面之下是对家人无条件的守护。它不是攻击性强，它只是爱得深。',
    trait2Color: '#B6D088',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_05.png',
    match: [
      { axis: 'social', op: '<', threshold: 50 },
      { axis: 'action', op: '>', threshold: 70 },
      { axis: 'strategy', op: '<', threshold: 50 },
    ],
  },
  {
    id: 'song-jiang', name: '宋江老大型', subtitle: '水浒系', code: 'S+M+P',
    identity: '狗届社交教父', tagline: '它不是社牛，它是梁山编制。',
    rarity: 'SR', rarityColor: '#77321C', rarityBg: '#D3C5AD', iconBg: '#D3C5AD',
    traits: ['喜欢交朋友', '爱组织', '有领导欲'],
    behaviors: ['公园建群', '谁都认识', '主动调停狗界矛盾'],
    breeds: ['金毛', '萨摩耶', '伯恩山'], job: '社区大使', soulRank: 'A-Tier Social Leader',
    social: 99, danger: 35, destroy: 40, clingy: 80, mental: 65,
    tags: ['社交教父', '和事佬'],
    trait1Title: 'PR Manager（公关大师）',
    trait1Desc: '没有它化解不了的僵局。陌生犬见面，它永远第一个上前破冰。',
    trait1Color: '#B6D088',
    trait2Title: 'Crowd Collector（集邮狂魔）',
    trait2Desc: '每次出门回来朋友圈又多了三个联系人。它在社交市场的估值持续走高。',
    trait2Color: '#FFB59E',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_06.png',
    match: [
      { axis: 'social', op: '>', threshold: 80 },
      { axis: 'clingy', op: '>', threshold: 60 },
      { axis: 'strategy', op: '>', threshold: 50 },
    ],
  },
  {
    id: 'lu-zhi-shen', name: '鲁智深拆迁型', subtitle: '水浒系', code: 'A+F+E',
    identity: '暴力拆家艺术家', tagline: '装修风格它说了算。',
    rarity: 'SSR', rarityColor: '#77321C', rarityBg: '#FFB59E', iconBg: '#FFB59E',
    traits: ['力气巨大', '情绪奔放', '行为离谱'],
    behaviors: ['连窝端', '拖鞋碎尸案', '一言不合开始发疯'],
    breeds: ['哈士奇', '阿拉斯加', '拉布拉多幼犬'], job: '室内改造师', soulRank: 'S-Tier Destroyer',
    social: 70, danger: 75, destroy: 99, clingy: 65, mental: 20,
    tags: ['拆迁之神', '情绪核弹'],
    trait1Title: 'Demo Mode（拆迁模式）',
    trait1Desc: '任何物品在它眼中都是潜在的改造对象。装修公司见了都笑了。',
    trait1Color: '#FFB59E',
    trait2Title: 'Drama Queen（戏精本精）',
    trait2Desc: '拥有奥斯卡级的委屈表演技巧，在拆完东西后还能展现出"不是我"的神情。',
    trait2Color: '#B6D088',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_07.png',
    match: [
      { axis: 'action', op: '>', threshold: 80 },
      { axis: 'freedom', op: '>', threshold: 70 },
      { axis: 'strategy', op: '<', threshold: 40 },
    ],
  },
  {
    id: 'tang-seng', name: '唐僧圣母型', subtitle: '西游记系', code: 'M+H+R',
    identity: '温柔小天使', tagline: '它觉得世界应该充满爱。',
    rarity: 'SR', rarityColor: '#54662E', rarityBg: '#CFE99F', iconBg: '#CFE99F',
    traits: ['共情能力强', '不爱冲突', '黏主人'],
    behaviors: ['主人难过会陪着', '不喜欢吵架', '喜欢贴贴'],
    breeds: ['金毛', '比格', '拉布拉多'], job: '情绪疗愈师', soulRank: 'A-Tier Angel',
    social: 85, danger: 10, destroy: 15, clingy: 99, mental: 75,
    tags: ['治愈天使', '和平使者'],
    trait1Title: 'Healing Beam（治愈光线）',
    trait1Desc: '无需任何话语，只是静静趴在你旁边，就能让焦虑值下降80%。',
    trait1Color: '#B6D088',
    trait2Title: 'Peace Protocol（和平协议）',
    trait2Desc: '遇到任何冲突自动开启"劝和模式"，用温柔眼神消弭所有敌意。',
    trait2Color: '#D3C5AD',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_08.png',
    match: [
      { axis: 'clingy', op: '>', threshold: 80 },
      { axis: 'action', op: '<', threshold: 40 },
      { axis: 'freedom', op: '<', threshold: 50 },
    ],
  },
  {
    id: 'zhu-ba-jie', name: '八戒干饭型', subtitle: '猪八戒系', code: 'F+H+M',
    identity: '干饭快乐主义者', tagline: '天大地大，吃饭最大。',
    rarity: 'R', rarityColor: '#77321C', rarityBg: '#F0E0C8', iconBg: '#F0E0C8',
    traits: ['爱吃', '爱睡', '快乐'],
    behaviors: ['厨房永动机', '听到塑料袋立刻闪现', '减肥永远失败'],
    breeds: ['柯基', '法斗', '巴哥'], job: '美食评论家', soulRank: 'B-Tier Foodie',
    social: 65, danger: 20, destroy: 45, clingy: 70, mental: 60,
    tags: ['干饭之神', '睡眠大师'],
    trait1Title: 'Food Radar（食物雷达）',
    trait1Desc: '500米外开包装的声音，能在0.8秒内从深度睡眠切换到厨房待命状态。',
    trait1Color: '#D3C5AD',
    trait2Title: 'Happy Sloth（快乐懒虫）',
    trait2Desc: '人生哲学：吃好睡好就是赢。对任何焦虑免疫，是全家的精神稳定剂。',
    trait2Color: '#B6D088',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_09.png',
    match: [
      { axis: 'freedom', op: '>', threshold: 70 },
      { axis: 'action', op: '<', threshold: 50 },
      { axis: 'clingy', op: '>', threshold: 60 },
    ],
  },
  {
    id: 'sha-seng', name: '沙僧老实型', subtitle: '沙和尚系', code: 'H+E+R',
    identity: '稳定可靠老员工', tagline: '它可能是全家唯一成熟的。',
    rarity: 'R', rarityColor: '#54662E', rarityBg: '#CFE99F', iconBg: '#CFE99F',
    traits: ['情绪稳定', '老实听话', '默默陪伴'],
    behaviors: ['永远不惹事', '指令完成度高', '情绪稳定得像AI'],
    breeds: ['拉布拉多', '金毛', '边牧'], job: '首席执行员', soulRank: 'A-Tier Reliable',
    social: 70, danger: 15, destroy: 10, clingy: 88, mental: 92,
    tags: ['稳定之源', '可靠伙伴'],
    trait1Title: 'Rock Solid（稳如磐石）',
    trait1Desc: '家里发生任何事，它都能以稳定的状态陪伴。你的情绪是它的天气预报。',
    trait1Color: '#B6D088',
    trait2Title: 'Zero Drama（零内耗）',
    trait2Desc: '不争不抢，不闹不哭。它活成了所有人羡慕的精神状态。',
    trait2Color: '#D3C5AD',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_10.png',
    match: [
      { axis: 'action', op: '<', threshold: 40 },
      { axis: 'freedom', op: '<', threshold: 40 },
      { axis: 'strategy', op: '<', threshold: 50 },
    ],
  },
  {
    id: 'wang-xi-feng', name: '王熙凤掌控型', subtitle: '红楼梦系', code: 'S+P+R',
    identity: '心机管理大师', tagline: '它已经学会管理这个家了。',
    rarity: 'SSR', rarityColor: '#77321C', rarityBg: '#D3C5AD', iconBg: '#D3C5AD',
    traits: ['控制欲', '高情商', '会拿捏人'],
    behaviors: ['精准拿捏主人', '会演', '很懂人类情绪'],
    breeds: ['博美', '贵宾', '柴犬'], job: '家务总管', soulRank: 'S-Tier Controller',
    social: 88, danger: 55, destroy: 50, clingy: 75, mental: 90,
    tags: ['情绪大师', '家庭CEO'],
    trait1Title: 'Mind Reader（读心神技）',
    trait1Desc: '能在你开口前就知道你想要什么，并提前准备好让你无法拒绝的眼神。',
    trait1Color: '#D3C5AD',
    trait2Title: 'Drama Director（编剧天才）',
    trait2Desc: '每一个动作都经过精密计算。那个"偶然"撒娇，其实排练了三遍。',
    trait2Color: '#FFB59E',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_11.png',
    match: [
      { axis: 'social', op: '>', threshold: 70 },
      { axis: 'strategy', op: '>', threshold: 80 },
      { axis: 'freedom', op: '<', threshold: 50 },
    ],
  },
  {
    id: 'li-kui', name: '李逵疯批型', subtitle: '水浒系', code: 'A+S+E',
    identity: '移动型危险生物', tagline: '它的情绪像没拴绳。',
    rarity: 'SSR', rarityColor: '#77321C', rarityBg: '#FFB59E', iconBg: '#FFB59E',
    traits: ['冲动', '情绪爆炸', '发疯不可预测'],
    behaviors: ['突然暴冲', '半夜起飞', '永远控制不住'],
    breeds: ['哈士奇', '马犬', '斗牛犬'], job: '混乱制造者', soulRank: 'S-Tier Unpredictable',
    social: 60, danger: 98, destroy: 95, clingy: 50, mental: 8,
    tags: ['混乱之源', '不可预测'],
    trait1Title: 'Chaos Spike（混乱峰值）',
    trait1Desc: '从0到100的状态切换时间：0.2秒。触发条件：任何事物。',
    trait1Color: '#FFB59E',
    trait2Title: 'Night Terror（夜间起飞）',
    trait2Desc: '凌晨3点是它的黄金时段。全家熟睡时，它正在规划下一次大行动。',
    trait2Color: '#B6D088',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_12.png',
    match: [
      { axis: 'action', op: '>', threshold: 80 },
      { axis: 'social', op: '>', threshold: 50 },
      { axis: 'strategy', op: '<', threshold: 30 },
    ],
  },
  {
    id: 'xue-bao-chai', name: '薛宝钗完美型', subtitle: '红楼梦系', code: 'R+H+P',
    identity: '优等生小狗', tagline: '它活得像宠物教材。',
    rarity: 'SR', rarityColor: '#54662E', rarityBg: '#CFE99F', iconBg: '#CFE99F',
    traits: ['稳定', '体面', '高配合度'],
    behaviors: ['不乱叫', '不拆家', '出门像别人家孩子'],
    breeds: ['金毛', '拉布拉多', '贵宾'], job: '宠物代言人', soulRank: 'A-Tier Perfect',
    social: 80, danger: 10, destroy: 5, clingy: 90, mental: 95,
    tags: ['完美模板', '别人家的狗'],
    trait1Title: 'Perfect Score（满分档案）',
    trait1Desc: '各项评估均在优秀区间。训练师的梦中情宠，邻居羡慕的对象。',
    trait1Color: '#B6D088',
    trait2Title: 'Grace Mode（优雅模式）',
    trait2Desc: '永远保持得体。出门是形象大使，在家是情绪稳定器。',
    trait2Color: '#D3C5AD',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_13.png',
    match: [
      { axis: 'freedom', op: '<', threshold: 30 },
      { axis: 'action', op: '<', threshold: 40 },
      { axis: 'strategy', op: '>', threshold: 60 },
    ],
  },
  {
    id: 'sun-er-niang', name: '孙二娘黑店型', subtitle: '水浒系', code: 'P+F+I',
    identity: '表面可爱，背后搞事', tagline: '监控里全是它的犯罪证据。',
    rarity: 'SSR', rarityColor: '#77321C', rarityBg: '#FFB59E', iconBg: '#FFB59E',
    traits: ['坏心眼', '会套路', '社会气质'],
    behaviors: ['偷偷报复', '假装无辜', '专挑你不在时作案'],
    breeds: ['柴犬', '哈士奇', '边牧'], job: '地下侦探', soulRank: 'S-Tier Sneaky',
    social: 65, danger: 70, destroy: 88, clingy: 55, mental: 85,
    tags: ['犯罪天才', '无辜脸大师'],
    trait1Title: 'Innocent Face（无辜专业户）',
    trait1Desc: '作案现场被抓，仍能在0.5秒内切换成"不是我"的表情，骗过所有人。',
    trait1Color: '#FFB59E',
    trait2Title: 'Revenge Art（报复艺术）',
    trait2Desc: '你以为它忘了上次你拒绝给它零食的事。它没有。它只是在等。',
    trait2Color: '#D3C5AD',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_14.png',
    match: [
      { axis: 'strategy', op: '>', threshold: 70 },
      { axis: 'freedom', op: '>', threshold: 60 },
      { axis: 'clingy', op: '<', threshold: 40 },
    ],
  },
  {
    id: 'lin-chong', name: '林冲隐忍型', subtitle: '水浒系', code: 'O+H+P',
    identity: '沉默防御型人格', tagline: '它平静，但不好惹。',
    rarity: 'SR', rarityColor: '#77321C', rarityBg: '#D3C5AD', iconBg: '#D3C5AD',
    traits: ['安静', '高警觉', '忍耐型'],
    behaviors: ['平时不吭声', '真出事最猛', '有自己的边界感'],
    breeds: ['德牧', '边牧', '秋田'], job: '低调守护者', soulRank: 'A-Tier Silent',
    social: 40, danger: 65, destroy: 35, clingy: 72, mental: 85,
    tags: ['沉默之力', '边界感大师'],
    trait1Title: 'Silent Watch（沉默守望）',
    trait1Desc: '99%的时间安静如初，但那1%爆发的时刻，会让所有人重新认识它。',
    trait1Color: '#D3C5AD',
    trait2Title: 'Boundary Pro（边界高手）',
    trait2Desc: '知道自己的边界在哪，也尊重你的。不靠近，不远离，刚刚好的距离。',
    trait2Color: '#B6D088',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_15.png',
    match: [
      { axis: 'social', op: '<', threshold: 30 },
      { axis: 'action', op: '<', threshold: 50 },
      { axis: 'strategy', op: '>', threshold: 50 },
    ],
  },
  {
    id: 'bai-long-ma', name: '白龙马打工型', subtitle: '西游记系', code: 'E+H+M',
    identity: '高配得感打工狗', tagline: '它像狗界公务员。',
    rarity: 'R', rarityColor: '#54662E', rarityBg: '#CFE99F', iconBg: '#CFE99F',
    traits: ['配合度高', '任劳任怨', '稳定输出'],
    behaviors: ['主人说啥都配合', '默默工作', '很少闹情绪'],
    breeds: ['拉布拉多', '金毛', '边牧'], job: '全能助理', soulRank: 'B-Tier Reliable',
    social: 72, danger: 18, destroy: 12, clingy: 85, mental: 88,
    tags: ['打工之魂', '配合度MAX'],
    trait1Title: 'Duty First（职责至上）',
    trait1Desc: '任务下达，立即执行。从不问为什么，只问怎么配合。最完美的工作拍档。',
    trait1Color: '#B6D088',
    trait2Title: 'Steady Output（稳定输出）',
    trait2Desc: '不高调，不耍脾气，不摆烂。每天准时出勤，从不缺席你的情感需求。',
    trait2Color: '#D3C5AD',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_16.png',
    match: [
      { axis: 'strategy', op: '<', threshold: 50 },
      { axis: 'action', op: '<', threshold: 40 },
      { axis: 'clingy', op: '>', threshold: 60 },
    ],
  },
];

// ===== 25 道场景行为题 =====
// 每个选项 scores 中：正数 = 正极加分，负数 = 反极加分；主+次维度 +2/+1
const QUESTIONS = [
  {
    id: 1,
    question: 'Q1: 你拿着零食却迟迟不给，它通常会？',
    options: [
      { label: '安静等待', scores: { action: -2, freedom: -1 } },
      { label: '一直盯着你', scores: { clingy: 2, social: -1 } },
      { label: '用爪子扒你', scores: { action: 2, clingy: 1 } },
      { label: '偷偷寻找别的获取方式', scores: { strategy: 2, freedom: 1 } },
    ],
    quote: 'How they pursue what they want reveals their soul.',
  },
  {
    id: 2,
    question: 'Q2: 第一次见陌生狗时？',
    options: [
      { label: '主动打招呼', scores: { social: 2, action: 1 } },
      { label: '躲在主人身边观察', scores: { social: -2, clingy: 1 } },
      { label: '绕圈观察后再接近', scores: { strategy: 2, social: -1 } },
      { label: '压根不感兴趣', scores: { freedom: 2, social: -1 } },
    ],
    quote: 'Meeting strangers tells you everything about the inner world.',
  },
  {
    id: 3,
    question: 'Q3: 散步时突然发现新路线？',
    options: [
      { label: '立刻冲过去', scores: { action: 2, freedom: 1 } },
      { label: '看看主人意见', scores: { clingy: 2, freedom: -1 } },
      { label: '先观察环境', scores: { strategy: 2, action: -1 } },
      { label: '按原路线继续走', scores: { freedom: -2 } },
    ],
    quote: 'A new path is a mirror of the heart\'s courage.',
  },
  {
    id: 4,
    question: 'Q4: 主人回家时？',
    options: [
      { label: '疯狂迎接', scores: { social: 2, clingy: 1 } },
      { label: '默默靠近蹭蹭', scores: { clingy: 2, action: -1 } },
      { label: '观察一会再行动', scores: { strategy: 2 } },
      { label: '继续做自己的事', scores: { freedom: 2 } },
    ],
    quote: 'Reunion is the purest test of bonds.',
  },
  {
    id: 5,
    question: 'Q5: 玩具掉到沙发底下？',
    options: [
      { label: '疯狂扒拉', scores: { action: 2 } },
      { label: '求助主人', scores: { clingy: 2 } },
      { label: '寻找角度取出', scores: { strategy: 2 } },
      { label: '放弃再找别的玩具', scores: { freedom: 2 } },
    ],
    quote: 'Obstacles reveal whether one solves, asks, or moves on.',
  },
  {
    id: 6,
    question: 'Q6: 遇到比自己大的狗？',
    options: [
      { label: '照样冲过去', scores: { action: 2, social: 1 } },
      { label: '靠近主人', scores: { clingy: 2 } },
      { label: '观察后决定', scores: { strategy: 2 } },
      { label: '主动绕开', scores: { freedom: 1, action: -1 } },
    ],
    quote: 'Facing the bigger reveals the truer self.',
  },
  {
    id: 7,
    question: 'Q7: 下雨不能出门时？',
    options: [
      { label: '满屋乱跑', scores: { action: 2, freedom: 1 } },
      { label: '守在主人身边', scores: { clingy: 2 } },
      { label: '自己找乐子', scores: { strategy: 2 } },
      { label: '睡觉接受现实', scores: { action: -2 } },
    ],
    quote: 'How one spends a closed day reveals an open soul.',
  },
  {
    id: 8,
    question: 'Q8: 家里来了客人？',
    options: [
      { label: '立刻接待', scores: { social: 2 } },
      { label: '贴着主人', scores: { clingy: 2 } },
      { label: '远处观察', scores: { strategy: 2, social: -1 } },
      { label: '无所谓继续休息', scores: { freedom: 2 } },
    ],
    quote: 'How a dog welcomes strangers mirrors its inner pack.',
  },
  {
    id: 9,
    question: 'Q9: 主人训练新指令时？',
    options: [
      { label: '马上尝试', scores: { action: 2 } },
      { label: '看主人表情', scores: { clingy: 2 } },
      { label: '先研究规律', scores: { strategy: 2 } },
      { label: '兴趣一般', scores: { freedom: 2 } },
    ],
    quote: 'Intelligence is not just learning, but choosing what to learn.',
  },
  {
    id: 10,
    question: 'Q10: 闻到厨房香味？',
    options: [
      { label: '直接冲过去', scores: { action: 2 } },
      { label: '坐下等投喂', scores: { clingy: 2 } },
      { label: '寻找偷吃机会', scores: { strategy: 2 } },
      { label: '闻闻就走', scores: { freedom: 2 } },
    ],
    quote: 'Hunger reveals the truest problem-solving instinct.',
  },
  {
    id: 11,
    question: 'Q11: 洗澡前发现情况不妙？',
    options: [
      { label: '拔腿就跑', scores: { action: 2, freedom: 1 } },
      { label: '向主人撒娇', scores: { clingy: 2 } },
      { label: '提前藏起来', scores: { strategy: 2 } },
      { label: '平静接受', scores: { freedom: -2 } },
    ],
    quote: 'How they endure discomfort speaks of emotional depth.',
  },
  {
    id: 12,
    question: 'Q12: 家里有新玩具？',
    options: [
      { label: '第一时间试玩', scores: { action: 2 } },
      { label: '叼给主人看', scores: { clingy: 2 } },
      { label: '研究怎么玩', scores: { strategy: 2 } },
      { label: '过会再说', scores: { freedom: 1 } },
    ],
    quote: 'Play is the most honest window into a dog\'s mind.',
  },
  {
    id: 13,
    question: 'Q13: 面对不喜欢吃的食物？',
    options: [
      { label: '直接拒绝', scores: { freedom: 2 } },
      { label: '委屈看主人', scores: { clingy: 2 } },
      { label: '挑着吃', scores: { strategy: 2 } },
      { label: '硬着头皮吃掉', scores: { freedom: -2 } },
    ],
    quote: 'The ritual of eating reveals the philosophy of living.',
  },
  {
    id: 14,
    question: 'Q14: 主人心情不好时？',
    options: [
      { label: '主动安慰', scores: { social: 2, clingy: 1 } },
      { label: '安静陪着', scores: { clingy: 2 } },
      { label: '观察状态再行动', scores: { strategy: 2 } },
      { label: '没察觉', scores: { freedom: 1 } },
    ],
    quote: 'Loyal companions feel what words cannot say.',
  },
  {
    id: 15,
    question: 'Q15: 公园里很多狗聚会？',
    options: [
      { label: '挨个认识', scores: { social: 2 } },
      { label: '跟着熟悉的狗', scores: { clingy: 2 } },
      { label: '观察群体关系', scores: { strategy: 2 } },
      { label: '独自探索', scores: { freedom: 2 } },
    ],
    quote: 'Social capacity mirrors openness to the world.',
  },
  {
    id: 16,
    question: 'Q16: 被主人制止时？',
    options: [
      { label: '继续试探', scores: { action: 2 } },
      { label: '马上停下', scores: { clingy: 2 } },
      { label: '换种方式达成目的', scores: { strategy: 2 } },
      { label: '满不在乎', scores: { freedom: 2 } },
    ],
    quote: 'How one receives correction reveals the bond.',
  },
  {
    id: 17,
    question: 'Q17: 听到门外有动静？',
    options: [
      { label: '立刻冲过去', scores: { action: 2 } },
      { label: '看看主人反应', scores: { clingy: 2 } },
      { label: '先观察来源', scores: { strategy: 2 } },
      { label: '懒得理会', scores: { freedom: 2 } },
    ],
    quote: 'Vigilance and calm are two faces of the same coin.',
  },
  {
    id: 18,
    question: 'Q18: 主人准备出门？',
    options: [
      { label: '兴奋跟随', scores: { social: 2 } },
      { label: '舍不得离开', scores: { clingy: 2 } },
      { label: '提前守门', scores: { strategy: 2 } },
      { label: '继续睡觉', scores: { freedom: 2 } },
    ],
    quote: 'Separation reveals the depth of attachment.',
  },
  {
    id: 19,
    question: 'Q19: 拿到新零食？',
    options: [
      { label: '立刻吃掉', scores: { action: 2 } },
      { label: '给主人看看', scores: { clingy: 2 } },
      { label: '藏起来以后吃', scores: { strategy: 2 } },
      { label: '想吃再吃', scores: { freedom: 2 } },
    ],
    quote: 'What one does with abundance reveals their nature.',
  },
  {
    id: 20,
    question: 'Q20: 参加狗狗聚会？',
    options: [
      { label: '全场社交', scores: { social: 2 } },
      { label: '跟熟人待一起', scores: { clingy: 2 } },
      { label: '观察局势', scores: { strategy: 2 } },
      { label: '自己玩自己的', scores: { freedom: 2 } },
    ],
    quote: 'In a crowd, the soul chooses its own orbit.',
  },
  {
    id: 21,
    question: 'Q21: 玩追逐游戏时？',
    options: [
      { label: '全力冲刺', scores: { action: 2 } },
      { label: '跟着主人玩', scores: { clingy: 2 } },
      { label: '找最佳路线', scores: { strategy: 2 } },
      { label: '跑两步就躺', scores: { freedom: 2 } },
    ],
    quote: 'The chase reveals what truly drives the heart.',
  },
  {
    id: 22,
    question: 'Q22: 家里换家具？',
    options: [
      { label: '立刻探索', scores: { action: 2 } },
      { label: '跟主人确认', scores: { clingy: 2 } },
      { label: '仔细检查', scores: { strategy: 2 } },
      { label: '无所谓', scores: { freedom: 2 } },
    ],
    quote: 'Change tests whether the soul is curious or content.',
  },
  {
    id: 23,
    question: 'Q23: 发现陌生声音？',
    options: [
      { label: '马上查看', scores: { action: 2 } },
      { label: '贴近主人', scores: { clingy: 2 } },
      { label: '先分析来源', scores: { strategy: 2 } },
      { label: '不感兴趣', scores: { freedom: 2 } },
    ],
    quote: 'How one faces the unknown speaks of inner courage.',
  },
  {
    id: 24,
    question: 'Q24: 很久没见的人来了？',
    options: [
      { label: '冲上去撒娇', scores: { action: 2, clingy: 1 } },
      { label: '贴着对方不走', scores: { clingy: 2 } },
      { label: '观察是否可信', scores: { strategy: 2 } },
      { label: '爱搭不理', scores: { freedom: 2 } },
    ],
    quote: 'Old bonds are weighed in the moment of return.',
  },
  {
    id: 25,
    question: 'Q25: 理想中的一天？',
    options: [
      { label: '到处玩到累', scores: { action: 2 } },
      { label: '和主人待一起', scores: { clingy: 2 } },
      { label: '探索新东西', scores: { strategy: 2 } },
      { label: '想吃就吃想睡就睡', scores: { freedom: 2 } },
    ],
    quote: 'The dream of a perfect day reveals the soul\'s true compass.',
  },
];

// ===== 计分逻辑 =====

// 单轴最大可能正向得分（用于归一化）
const AXIS_MAX = 20;

/**
 * 累计 5 轴原始得分（带正负号）
 * @param {Array} answers - [{questionId, optionIndex}]
 * @returns {Object} {social, clingy, action, strategy, freedom}（原始累加值，可正可负）
 */
function calcAxisRaw(answers) {
  const raw = { social: 0, clingy: 0, action: 0, strategy: 0, freedom: 0 };
  (answers || []).forEach(({ questionId, optionIndex }) => {
    const q = QUESTIONS.find(q => q.id === questionId);
    if (!q) return;
    const option = q.options[optionIndex];
    if (!option) return;
    Object.entries(option.scores).forEach(([axis, val]) => {
      if (raw[axis] !== undefined) raw[axis] += val;
    });
  });
  return raw;
}

/**
 * 归一化为 0-100，>50 偏正极，<50 偏反极
 */
function normalizeAxis(rawValue) {
  const v = Math.round((rawValue + AXIS_MAX) / (2 * AXIS_MAX) * 100);
  return Math.max(0, Math.min(100, v));
}

/**
 * 计算 5 轴雷达分（0-100）
 * @param {Array} answers
 * @returns {Object} {social, clingy, action, strategy, freedom}
 */
function calcAxisScores(answers) {
  const raw = calcAxisRaw(answers);
  return {
    social: normalizeAxis(raw.social),
    clingy: normalizeAxis(raw.clingy),
    action: normalizeAxis(raw.action),
    strategy: normalizeAxis(raw.strategy),
    freedom: normalizeAxis(raw.freedom),
  };
}

/**
 * 兼容旧入参：传 axisScores 时直接返回；传 answers 时先 calcAxisScores
 */
function calcRadarScores(input) {
  if (!input) return { social: 50, clingy: 50, action: 50, strategy: 50, freedom: 50 };
  // 已是 axisScores 对象
  if (typeof input.social === 'number' && typeof input.action === 'number') {
    return {
      social: input.social,
      clingy: input.clingy,
      action: input.action,
      strategy: input.strategy,
      freedom: input.freedom,
    };
  }
  // 兼容旧调用：calcRadarScores(scoresFromAnswers)，但此处 scores 已是 15 维 → 走兜底
  return { social: 50, clingy: 50, action: 50, strategy: 50, freedom: 50 };
}

/**
 * 软匹配单条件：超过阈值越多匹配度越高，反向跌破不计分
 * @returns {Number} 0-1
 */
function matchCondition(value, op, threshold) {
  if (op === '>') {
    return Math.max(0, Math.min(1, (value - threshold) / 30));
  }
  if (op === '<') {
    return Math.max(0, Math.min(1, (threshold - value) / 30));
  }
  return 0;
}

/**
 * 根据 5 轴得分匹配人格
 * @returns {{ primary, secondary, fitMap, primaryFit, secondaryFit }}
 */
function calcPersonalityV2(axisScores) {
  const fitMap = {};
  PERSONALITIES.forEach(p => {
    if (!p.match || !p.match.length) {
      fitMap[p.id] = 0;
      return;
    }
    const sum = p.match.reduce((acc, cond) => {
      return acc + matchCondition(axisScores[cond.axis] || 0, cond.op, cond.threshold);
    }, 0);
    fitMap[p.id] = Math.round(sum / p.match.length * 100);
  });

  // 取 top 2
  const sortedIds = Object.keys(fitMap).sort((a, b) => fitMap[b] - fitMap[a]);
  const primaryId = sortedIds[0];
  const secondaryId = sortedIds[1];
  const primary = PERSONALITIES.find(p => p.id === primaryId) || PERSONALITIES[0];
  const secondary = PERSONALITIES.find(p => p.id === secondaryId);
  const primaryFit = fitMap[primaryId] || 0;
  const secondaryFit = fitMap[secondaryId] || 0;

  return { primary, secondary, fitMap, primaryFit, secondaryFit };
}

/**
 * 根据答题记录匹配狗格（保持旧接口兼容）
 * @param {Array} answers
 * @returns {Object} { personality, secondary, primaryFit, secondaryFit, scores, radar, fitMap }
 */
function calcPersonality(answers) {
  const axisScores = calcAxisScores(answers);
  const { primary, secondary, fitMap, primaryFit, secondaryFit } = calcPersonalityV2(axisScores);
  return {
    personality: primary,
    secondary: secondary || null,
    primaryFit,
    secondaryFit,
    fitMap,
    scores: axisScores,        // 保持 scores 字段名（旧版透传到 result）
    radar: axisScores,         // 同义别名
    topDims: axisScores,       // 兼容旧字段
  };
}

module.exports = {
  AXES,
  PERSONALITIES,
  QUESTIONS,
  calcAxisScores,
  calcPersonality,
  calcPersonalityV2,
  calcRadarScores,
};
