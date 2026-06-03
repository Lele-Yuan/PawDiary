// DGTI 狗格测试 - 核心数据层
// 5大模型 × 3子维度 = 15个狗格维度，派生16种经典狗格人格

// ===== 15个维度定义 =====
const DIMENSIONS = {
  // MODEL 1: 社交能量模型 Social Paw
  E: { code: 'E', name: '外向疯狗型', model: 'Social Paw', color: '#FFB59E' },
  I: { code: 'I', name: '内向观察型', model: 'Social Paw', color: '#CFE99F' },
  A: { code: 'A', name: '焦虑雷达型', model: 'Social Paw', color: '#EFDDD B' },
  // MODEL 2: 情绪表达模型 Emotional Tail
  F: { code: 'F', name: '戏精情绪型', model: 'Emotional Tail', color: '#FFB59E' },
  S: { code: 'S', name: '稳定老干部型', model: 'Emotional Tail', color: '#CFE99F' },
  M: { code: 'M', name: '黏人恋爱脑型', model: 'Emotional Tail', color: '#EFDDD B' },
  // MODEL 3: 行动策略模型 Action Drive
  C: { code: 'C', name: '领导控制型', model: 'Action Drive', color: '#D3C5AD' },
  G: { code: 'G', name: '快乐摆烂型', model: 'Action Drive', color: '#CFE99F' },
  D: { code: 'D', name: '拆迁爆破型', model: 'Action Drive', color: '#FFB59E' },
  // MODEL 4: 脑回路模型 Brain Circuit
  P: { code: 'P', name: '心机军师型', model: 'Brain Circuit', color: '#D3C5AD' },
  Z: { code: 'Z', name: '天才疯狗型', model: 'Brain Circuit', color: '#FFB59E' },
  T: { code: 'T', name: '学霸执行型', model: 'Brain Circuit', color: '#CFE99F' },
  // MODEL 5: 生活价值观模型 Life Philosophy
  R: { code: 'R', name: '仪式感贵族型', model: 'Life Philosophy', color: '#D3C5AD' },
  B: { code: 'B', name: '街溜子自由型', model: 'Life Philosophy', color: '#FFB59E' },
  H: { code: 'H', name: '治愈天使型', model: 'Life Philosophy', color: '#CFE99F' },
};

// ===== 16个狗格人格 =====
const PERSONALITIES = [
  {
    id: 'qi-tian',
    name: '齐天疯狗型',
    subtitle: '孙悟空系',
    code: 'Z+D+E',
    identity: '精神状态遥遥领先',
    tagline: '它不是在发疯，它是在修仙。',
    rarity: 'SSR',
    rarityColor: '#77321C',
    rarityBg: '#CFE99F',
    iconBg: '#CFE99F',
    traits: ['半夜跑酷', '永远坐不住', '精力核爆', '越管越疯'],
    behaviors: ['客厅大闹天宫', '五分钟拆一个玩具', '情绪像过山车'],
    breeds: ['哈士奇', '柴犬', '澳洲牧羊犬'],
    job: '极限运动员',
    soulRank: 'S-Tier Chaotic',
    social: 90, danger: 85, destroy: 99, clingy: 30, mental: 5,
    tags: ['狂暴之源', '传送门大师'],
    trait1Title: 'Energy Nuke（能量核爆）',
    trait1Desc: '跑在永动机上。进公园不是散步，是开疆拓土。睡觉只是充电暂停。',
    trait1Color: '#B6D088',
    trait2Title: 'Chaos Engine（混乱引擎）',
    trait2Desc: '在没有任何预兆的情况下，以0.3秒完成从"乖"到"发疯"的切换。',
    trait2Color: '#FFB59E',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_01.png',
  },
  {
    id: 'kong-ming',
    name: '孔明军师型',
    subtitle: '诸葛亮系',
    code: 'T+P+C',
    identity: '全家战略指挥官',
    tagline: '它已经开始复盘你的失误了。',
    rarity: 'SSR',
    rarityColor: '#54662E',
    rarityBg: '#CFE99F',
    iconBg: '#D3C5AD',
    traits: ['高智商', '观察力恐怖', '喜欢管理别人', '会套路主人'],
    behaviors: ['偷偷布局', '精准骗零食', '指挥全家行动'],
    breeds: ['边牧', '杜宾', '德牧'],
    job: '战略顾问',
    soulRank: 'S-Tier Strategist',
    social: 60, danger: 40, destroy: 30, clingy: 70, mental: 95,
    tags: ['智商压制', '零食骗局'],
    trait1Title: 'Master Plan（大局为先）',
    trait1Desc: '每天清晨规划你的失误，每天夜晚等待你犯错。它早已看穿一切。',
    trait1Color: '#B6D088',
    trait2Title: 'Snack Trap（零食陷阱）',
    trait2Desc: '装出最无辜的眼神，在你毫无防备时精准出击，零食到手率99%。',
    trait2Color: '#FFB59E',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_02.png',
  },
  {
    id: 'dai-yu',
    name: '黛玉敏感型',
    subtitle: '林黛玉系',
    code: 'F+M+I',
    identity: '玻璃心情绪艺术家',
    tagline: '它不是脆弱，它只是情绪细腻。',
    rarity: 'SR',
    rarityColor: '#77321C',
    rarityBg: '#F0E0C8',
    iconBg: '#FFF1ED',
    traits: ['超级敏感', '情绪波动大', '黏人', '容易委屈'],
    behaviors: ['你语气不对它都知道', '被忽略会emo', '喜欢贴贴'],
    breeds: ['比熊', '博美', '小体贵宾'],
    job: '情绪感知师',
    soulRank: 'A-Tier Sensitive',
    social: 55, danger: 20, destroy: 25, clingy: 98, mental: 40,
    tags: ['玻璃心', '贴贴专家'],
    trait1Title: 'Heart Radar（情绪雷达）',
    trait1Desc: '能在你叹气0.5秒内感知到你的情绪波动，并立刻展开安慰行动。',
    trait1Color: '#FFB59E',
    trait2Title: 'Drama Tear（委屈珍珠）',
    trait2Desc: '被轻微忽视后，可持续释放"委屈光环"长达30分钟，直到获得充分安抚。',
    trait2Color: '#B6D088',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_03.png',
  },
  {
    id: 'bao-yu',
    name: '宝玉摆烂型',
    subtitle: '贾宝玉系',
    code: 'G+H+B',
    identity: '快乐废物哲学家',
    tagline: '狗生这么短，何必上班。',
    rarity: 'SR',
    rarityColor: '#54662E',
    rarityBg: '#CFE99F',
    iconBg: '#CFE99F',
    traits: ['能躺绝不站', '喜欢享受', '温柔', '不爱竞争'],
    behaviors: ['晒太阳一下午', '对世界毫无攻击性', '吃完就睡'],
    breeds: ['金毛', '拉布拉多', '柯基'],
    job: '首席躺平官',
    soulRank: 'B-Tier Zen Master',
    social: 75, danger: 5, destroy: 15, clingy: 85, mental: 80,
    tags: ['摆烂哲学家', '温柔系'],
    trait1Title: 'Golden Sloth（黄金懒虫）',
    trait1Desc: '找到任何一块阳光，可以不动长达4小时，并在此期间保持完美的幸福感。',
    trait1Color: '#B6D088',
    trait2Title: 'Peace Vibes（和平光环）',
    trait2Desc: '对任何冲突毫无兴趣。路遇吵架自动绕道，世界和平靠它守护。',
    trait2Color: '#D3C5AD',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_04.png',
  },
  {
    id: 'wu-song',
    name: '武松战神型',
    subtitle: '水浒系',
    code: 'A+C+D',
    identity: '家门口第一保镖',
    tagline: '这个家，得靠它镇场子。',
    rarity: 'SSR',
    rarityColor: '#77321C',
    rarityBg: '#FFB59E',
    iconBg: '#FFB59E',
    traits: ['战斗欲强', '领地意识爆棚', '护主'],
    behaviors: ['快递员宿敌', '觉得全世界危险', '随时准备开战'],
    breeds: ['罗威纳', '德牧', '杜宾'],
    job: '保镖队长',
    soulRank: 'S-Tier Guardian',
    social: 30, danger: 95, destroy: 70, clingy: 60, mental: 55,
    tags: ['领地守卫', '快递员克星'],
    trait1Title: 'Territory Lock（领地锁定）',
    trait1Desc: '半径50米内所有异动，均在监控之下。入侵者将在0.1秒内被识别并响应。',
    trait1Color: '#FFB59E',
    trait2Title: 'Loyal Core（忠诚内核）',
    trait2Desc: '凶猛表面之下是对家人无条件的守护。它不是攻击性强，它只是爱得深。',
    trait2Color: '#B6D088',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_05.png',
  },
  {
    id: 'song-jiang',
    name: '宋江老大型',
    subtitle: '水浒系',
    code: 'E+C+H',
    identity: '狗届社交教父',
    tagline: '它不是社牛，它是梁山编制。',
    rarity: 'SR',
    rarityColor: '#77321C',
    rarityBg: '#D3C5AD',
    iconBg: '#D3C5AD',
    traits: ['喜欢交朋友', '爱组织', '有领导欲'],
    behaviors: ['公园建群', '谁都认识', '主动调停狗界矛盾'],
    breeds: ['金毛', '萨摩耶', '伯恩山'],
    job: '社区大使',
    soulRank: 'A-Tier Social Leader',
    social: 99, danger: 35, destroy: 40, clingy: 80, mental: 65,
    tags: ['社交教父', '和事佬'],
    trait1Title: 'PR Manager（公关大师）',
    trait1Desc: '没有它化解不了的僵局。陌生犬见面，它永远第一个上前破冰。',
    trait1Color: '#B6D088',
    trait2Title: 'Crowd Collector（集邮狂魔）',
    trait2Desc: '每次出门回来朋友圈又多了三个联系人。它在社交市场的估值持续走高。',
    trait2Color: '#FFB59E',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_06.png',
  },
  {
    id: 'lu-zhi-shen',
    name: '鲁智深拆迁型',
    subtitle: '水浒系',
    code: 'D+F+Z',
    identity: '暴力拆家艺术家',
    tagline: '装修风格它说了算。',
    rarity: 'SSR',
    rarityColor: '#77321C',
    rarityBg: '#FFB59E',
    iconBg: '#FFB59E',
    traits: ['力气巨大', '情绪奔放', '行为离谱'],
    behaviors: ['连窝端', '拖鞋碎尸案', '一言不合开始发疯'],
    breeds: ['哈士奇', '阿拉斯加', '拉布拉多幼犬'],
    job: '室内改造师',
    soulRank: 'S-Tier Destroyer',
    social: 70, danger: 75, destroy: 99, clingy: 65, mental: 20,
    tags: ['拆迁之神', '情绪核弹'],
    trait1Title: 'Demo Mode（拆迁模式）',
    trait1Desc: '任何物品在它眼中都是潜在的改造对象。装修公司见了都笑了。',
    trait1Color: '#FFB59E',
    trait2Title: 'Drama Queen（戏精本精）',
    trait2Desc: '拥有奥斯卡级的委屈表演技巧，在拆完东西后还能展现出"不是我"的神情。',
    trait2Color: '#B6D088',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_07.png',
  },
  {
    id: 'tang-seng',
    name: '唐僧圣母型',
    subtitle: '西游记系',
    code: 'H+S+M',
    identity: '温柔小天使',
    tagline: '它觉得世界应该充满爱。',
    rarity: 'SR',
    rarityColor: '#54662E',
    rarityBg: '#CFE99F',
    iconBg: '#CFE99F',
    traits: ['共情能力强', '不爱冲突', '黏主人'],
    behaviors: ['主人难过会陪着', '不喜欢吵架', '喜欢贴贴'],
    breeds: ['金毛', '比格', '拉布拉多'],
    job: '情绪疗愈师',
    soulRank: 'A-Tier Angel',
    social: 85, danger: 10, destroy: 15, clingy: 99, mental: 75,
    tags: ['治愈天使', '和平使者'],
    trait1Title: 'Healing Beam（治愈光线）',
    trait1Desc: '无需任何话语，只是静静趴在你旁边，就能让焦虑值下降80%。',
    trait1Color: '#B6D088',
    trait2Title: 'Peace Protocol（和平协议）',
    trait2Desc: '遇到任何冲突自动开启"劝和模式"，用温柔眼神消弭所有敌意。',
    trait2Color: '#D3C5AD',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_08.png',
  },
  {
    id: 'zhu-ba-jie',
    name: '八戒干饭型',
    subtitle: '猪八戒系',
    code: 'G+B+F',
    identity: '干饭快乐主义者',
    tagline: '天大地大，吃饭最大。',
    rarity: 'R',
    rarityColor: '#77321C',
    rarityBg: '#F0E0C8',
    iconBg: '#F0E0C8',
    traits: ['爱吃', '爱睡', '快乐'],
    behaviors: ['厨房永动机', '听到塑料袋立刻闪现', '减肥永远失败'],
    breeds: ['柯基', '法斗', '巴哥'],
    job: '美食评论家',
    soulRank: 'B-Tier Foodie',
    social: 65, danger: 20, destroy: 45, clingy: 70, mental: 60,
    tags: ['干饭之神', '睡眠大师'],
    trait1Title: 'Food Radar（食物雷达）',
    trait1Desc: '500米外开包装的声音，能在0.8秒内从深度睡眠切换到厨房待命状态。',
    trait1Color: '#D3C5AD',
    trait2Title: 'Happy Sloth（快乐懒虫）',
    trait2Desc: '人生哲学：吃好睡好就是赢。对任何焦虑免疫，是全家的精神稳定剂。',
    trait2Color: '#B6D088',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_09.png',
  },
  {
    id: 'sha-seng',
    name: '沙僧老实型',
    subtitle: '沙和尚系',
    code: 'S+T+H',
    identity: '稳定可靠老员工',
    tagline: '它可能是全家唯一成熟的。',
    rarity: 'R',
    rarityColor: '#54662E',
    rarityBg: '#CFE99F',
    iconBg: '#CFE99F',
    traits: ['情绪稳定', '老实听话', '默默陪伴'],
    behaviors: ['永远不惹事', '指令完成度高', '情绪稳定得像AI'],
    breeds: ['拉布拉多', '金毛', '边牧'],
    job: '首席执行员',
    soulRank: 'A-Tier Reliable',
    social: 70, danger: 15, destroy: 10, clingy: 88, mental: 92,
    tags: ['稳定之源', '可靠伙伴'],
    trait1Title: 'Rock Solid（稳如磐石）',
    trait1Desc: '家里发生任何事，它都能以稳定的状态陪伴。你的情绪是它的天气预报。',
    trait1Color: '#B6D088',
    trait2Title: 'Zero Drama（零内耗）',
    trait2Desc: '不争不抢，不闹不哭。它活成了所有人羡慕的精神状态。',
    trait2Color: '#D3C5AD',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_10.png',
  },
  {
    id: 'wang-xi-feng',
    name: '王熙凤掌控型',
    subtitle: '红楼梦系',
    code: 'P+C+F',
    identity: '心机管理大师',
    tagline: '它已经学会管理这个家了。',
    rarity: 'SSR',
    rarityColor: '#77321C',
    rarityBg: '#D3C5AD',
    iconBg: '#D3C5AD',
    traits: ['控制欲', '高情商', '会拿捏人'],
    behaviors: ['精准拿捏主人', '会演', '很懂人类情绪'],
    breeds: ['博美', '贵宾', '柴犬'],
    job: '家务总管',
    soulRank: 'S-Tier Controller',
    social: 88, danger: 55, destroy: 50, clingy: 75, mental: 90,
    tags: ['情绪大师', '家庭CEO'],
    trait1Title: 'Mind Reader（读心神技）',
    trait1Desc: '能在你开口前就知道你想要什么，并提前准备好让你无法拒绝的眼神。',
    trait1Color: '#D3C5AD',
    trait2Title: 'Drama Director（编剧天才）',
    trait2Desc: '每一个动作都经过精密计算。那个"偶然"撒娇，其实排练了三遍。',
    trait2Color: '#FFB59E',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_11.png',
  },
  {
    id: 'li-kui',
    name: '李逵疯批型',
    subtitle: '水浒系',
    code: 'D+Z+A',
    identity: '移动型危险生物',
    tagline: '它的情绪像没拴绳。',
    rarity: 'SSR',
    rarityColor: '#77321C',
    rarityBg: '#FFB59E',
    iconBg: '#FFB59E',
    traits: ['冲动', '情绪爆炸', '发疯不可预测'],
    behaviors: ['突然暴冲', '半夜起飞', '永远控制不住'],
    breeds: ['哈士奇', '马犬', '斗牛犬'],
    job: '混乱制造者',
    soulRank: 'S-Tier Unpredictable',
    social: 60, danger: 98, destroy: 95, clingy: 50, mental: 8,
    tags: ['混乱之源', '不可预测'],
    trait1Title: 'Chaos Spike（混乱峰值）',
    trait1Desc: '从0到100的状态切换时间：0.2秒。触发条件：任何事物。',
    trait1Color: '#FFB59E',
    trait2Title: 'Night Terror（夜间起飞）',
    trait2Desc: '凌晨3点是它的黄金时段。全家熟睡时，它正在规划下一次大行动。',
    trait2Color: '#B6D088',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_12.png',
  },
  {
    id: 'xue-bao-chai',
    name: '薛宝钗完美型',
    subtitle: '红楼梦系',
    code: 'R+S+H',
    identity: '优等生小狗',
    tagline: '它活得像宠物教材。',
    rarity: 'SR',
    rarityColor: '#54662E',
    rarityBg: '#CFE99F',
    iconBg: '#CFE99F',
    traits: ['稳定', '体面', '高配合度'],
    behaviors: ['不乱叫', '不拆家', '出门像别人家孩子'],
    breeds: ['金毛', '拉布拉多', '贵宾'],
    job: '宠物代言人',
    soulRank: 'A-Tier Perfect',
    social: 80, danger: 10, destroy: 5, clingy: 90, mental: 95,
    tags: ['完美模板', '别人家的狗'],
    trait1Title: 'Perfect Score（满分档案）',
    trait1Desc: '各项评估均在优秀区间。训练师的梦中情宠，邻居羡慕的对象。',
    trait1Color: '#B6D088',
    trait2Title: 'Grace Mode（优雅模式）',
    trait2Desc: '永远保持得体。出门是形象大使，在家是情绪稳定器。',
    trait2Color: '#D3C5AD',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_13.png',
  },
  {
    id: 'sun-er-niang',
    name: '孙二娘黑店型',
    subtitle: '水浒系',
    code: 'P+B+D',
    identity: '表面可爱，背后搞事',
    tagline: '监控里全是它的犯罪证据。',
    rarity: 'SSR',
    rarityColor: '#77321C',
    rarityBg: '#FFB59E',
    iconBg: '#FFB59E',
    traits: ['坏心眼', '会套路', '社会气质'],
    behaviors: ['偷偷报复', '假装无辜', '专挑你不在时作案'],
    breeds: ['柴犬', '哈士奇', '边牧'],
    job: '地下侦探',
    soulRank: 'S-Tier Sneaky',
    social: 65, danger: 70, destroy: 88, clingy: 55, mental: 85,
    tags: ['犯罪天才', '无辜脸大师'],
    trait1Title: 'Innocent Face（无辜专业户）',
    trait1Desc: '作案现场被抓，仍能在0.5秒内切换成"不是我"的表情，骗过所有人。',
    trait1Color: '#FFB59E',
    trait2Title: 'Revenge Art（报复艺术）',
    trait2Desc: '你以为它忘了上次你拒绝给它零食的事。它没有。它只是在等。',
    trait2Color: '#D3C5AD',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_14.png',
  },
  {
    id: 'lin-chong',
    name: '林冲隐忍型',
    subtitle: '水浒系',
    code: 'I+S+A',
    identity: '沉默防御型人格',
    tagline: '它平静，但不好惹。',
    rarity: 'SR',
    rarityColor: '#77321C',
    rarityBg: '#D3C5AD',
    iconBg: '#D3C5AD',
    traits: ['安静', '高警觉', '忍耐型'],
    behaviors: ['平时不吭声', '真出事最猛', '有自己的边界感'],
    breeds: ['德牧', '边牧', '秋田'],
    job: '低调守护者',
    soulRank: 'A-Tier Silent',
    social: 40, danger: 65, destroy: 35, clingy: 72, mental: 85,
    tags: ['沉默之力', '边界感大师'],
    trait1Title: 'Silent Watch（沉默守望）',
    trait1Desc: '99%的时间安静如初，但那1%爆发的时刻，会让所有人重新认识它。',
    trait1Color: '#D3C5AD',
    trait2Title: 'Boundary Pro（边界高手）',
    trait2Desc: '知道自己的边界在哪，也尊重你的。不靠近，不远离，刚刚好的距离。',
    trait2Color: '#B6D088',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_15.png',
  },
  {
    id: 'bai-long-ma',
    name: '白龙马打工型',
    subtitle: '西游记系',
    code: 'T+S+M',
    identity: '高配得感打工狗',
    tagline: '它像狗界公务员。',
    rarity: 'R',
    rarityColor: '#54662E',
    rarityBg: '#CFE99F',
    iconBg: '#CFE99F',
    traits: ['配合度高', '任劳任怨', '稳定输出'],
    behaviors: ['主人说啥都配合', '默默工作', '很少闹情绪'],
    breeds: ['拉布拉多', '金毛', '边牧'],
    job: '全能助理',
    soulRank: 'B-Tier Reliable',
    social: 72, danger: 18, destroy: 12, clingy: 85, mental: 88,
    tags: ['打工之魂', '配合度MAX'],
    trait1Title: 'Duty First（职责至上）',
    trait1Desc: '任务下达，立即执行。从不问为什么，只问怎么配合。最完美的工作拍档。',
    trait1Color: '#B6D088',
    trait2Title: 'Steady Output（稳定输出）',
    trait2Desc: '不高调，不耍脾气，不摆烂。每天准时出勤，从不缺席你的情感需求。',
    trait2Color: '#D3C5AD',
    iconImg: 'cloud://dev-5gfdj03w258c6084.6465-dev-5gfdj03w258c6084-1258320488/dgti/dog_16.png',
  },
];

// ===== 24道题目 =====
// 每个选项包含对应维度的得分权重
const QUESTIONS = [
  {
    id: 1,
    question: 'Q1: 你家狗看到快递员时？',
    options: [
      { label: '准备战斗，大声警告', scores: { A: 2, C: 1 } },
      { label: '兴奋贴贴，恨不得帮人家卸货', scores: { E: 2, F: 1 } },
      { label: '完全无视，继续睡觉', scores: { I: 2, G: 1 } },
      { label: '暗中观察，不动声色', scores: { A: 1, I: 1, P: 1 } },
    ],
    quote: '"Understanding the silent language of their reaction reveals the heart of their protective soul."',
  },
  {
    id: 2,
    question: 'Q2: 去公园遇到陌生狗时？',
    options: [
      { label: '第一个冲上去打招呼', scores: { E: 2, F: 1 } },
      { label: '躲在你身后偷看', scores: { I: 2, M: 1 } },
      { label: '原地警戒，发出警告', scores: { A: 2, C: 1 } },
      { label: '若无其事地绕过去', scores: { S: 2, I: 1 } },
    ],
    quote: '"The way a dog meets the world tells you everything about its inner world."',
  },
  {
    id: 3,
    question: 'Q3: 你出门上班时，它的反应是？',
    options: [
      { label: '趴门口等你回来，一动不动', scores: { M: 2, H: 1 } },
      { label: '继续睡觉，毫不在意', scores: { G: 2, S: 1 } },
      { label: '嚎叫、抓门，分离焦虑拉满', scores: { M: 2, F: 1 } },
      { label: '玩玩具自娱自乐', scores: { B: 2, G: 1 } },
    ],
    quote: '"Separation reveals the depth of attachment."',
  },
  {
    id: 4,
    question: 'Q4: 给它洗澡时？',
    options: [
      { label: '满浴室追逃，誓死不从', scores: { B: 2, D: 1 } },
      { label: '安静配合，就是偶尔抖一下', scores: { S: 2, T: 1 } },
      { label: '委屈巴巴，用眼神控诉你', scores: { F: 2, M: 1 } },
      { label: '配合完毕立刻在沙发蹭干', scores: { G: 1, D: 1, B: 1 } },
    ],
    quote: '"How they endure discomfort speaks to their emotional depth."',
  },
  {
    id: 5,
    question: 'Q5: 看到你拿出零食袋子时？',
    options: [
      { label: '以光速出现在你面前', scores: { G: 2, F: 1 } },
      { label: '假装淡定，实则已进入伏击状态', scores: { P: 2, I: 1 } },
      { label: '学各种才艺主动讨好', scores: { T: 2, E: 1 } },
      { label: '望着你，眼里满是温柔', scores: { H: 2, M: 1 } },
    ],
    quote: '"The pursuit of treats reveals the strategy of the soul."',
  },
  {
    id: 6,
    question: 'Q6: 家里来了新成员（人或动物），它的反应？',
    options: [
      { label: '立刻领地宣示，我是老大', scores: { C: 2, A: 1 } },
      { label: '热情迎接，立刻成为最佳友人', scores: { E: 2, H: 1 } },
      { label: '观察一周，确认对方安全再接触', scores: { I: 2, P: 1 } },
      { label: '继续自己的事，无所谓', scores: { G: 2, S: 1 } },
    ],
    quote: '"How a dog welcomes strangers mirrors its place in the pack."',
  },
  {
    id: 7,
    question: 'Q7: 训练新指令时，它的学习方式？',
    options: [
      { label: '学10遍记住，执行率100%', scores: { T: 2, S: 1 } },
      { label: '学会了，但只在有零食时执行', scores: { P: 2, G: 1 } },
      { label: '好像懂了，但过了一天就忘', scores: { Z: 2, F: 1 } },
      { label: '根本不学，走自己的路', scores: { B: 2, I: 1 } },
    ],
    quote: '"Intelligence is not just about learning; it\'s about choosing what to learn."',
  },
  {
    id: 8,
    question: 'Q8: 你心情不好的时候，它会？',
    options: [
      { label: '主动靠过来蹭你，不离开', scores: { H: 2, M: 1 } },
      { label: '感受到气氛不对，也默默在角落陪着', scores: { S: 2, H: 1 } },
      { label: '叼玩具来找你玩，试图让你开心', scores: { E: 2, F: 1 } },
      { label: '照常睡觉，好像不太察觉', scores: { G: 2, I: 1 } },
    ],
    quote: '"The most loyal companions feel what words cannot say."',
  },
  {
    id: 9,
    question: 'Q9: 家里某个角落突然出现奇怪的声音？',
    options: [
      { label: '立刻冲过去，誓要查个清楚', scores: { A: 2, C: 1 } },
      { label: '警惕地原地注视，不轻举妄动', scores: { A: 1, P: 1, I: 1 } },
      { label: '叫几声就算了，不管了', scores: { E: 1, G: 1, F: 1 } },
      { label: '睁开眼看一眼，继续睡', scores: { G: 2, S: 1 } },
    ],
    quote: '"Vigilance and calm are two faces of the same coin."',
  },
  {
    id: 10,
    question: 'Q10: 遛狗时，谁决定走哪条路？',
    options: [
      { label: '它，永远是它', scores: { C: 2, B: 1 } },
      { label: '你走哪它跟哪，乖乖的', scores: { T: 2, S: 1 } },
      { label: '走着走着就发现它早偏离了20米', scores: { Z: 2, B: 1 } },
      { label: '走到一半原地趴下，拒绝继续走', scores: { G: 2, I: 1 } },
    ],
    quote: '"The direction of a walk reveals who\'s truly in charge."',
  },
  {
    id: 11,
    question: 'Q11: 碰到它喜欢的人时？',
    options: [
      { label: '扑上去，全身撒欢，无差别热情', scores: { E: 2, F: 1 } },
      { label: '靠近蹭蹭，但保持矜持', scores: { I: 1, M: 1, S: 1 } },
      { label: '远远看着，不主动但也不拒绝', scores: { I: 2, A: 1 } },
      { label: '先闻一圈确认，再决定是否接受', scores: { P: 2, I: 1 } },
    ],
    quote: '"Affection, when freely given, is the purest language."',
  },
  {
    id: 12,
    question: 'Q12: 独处时，它在干什么？',
    options: [
      { label: '把家里所有玩具拖出来研究', scores: { Z: 2, D: 1 } },
      { label: '趴在你常坐的地方，等你回来', scores: { M: 2, H: 1 } },
      { label: '睡觉，吃水，继续睡觉', scores: { G: 2, S: 1 } },
      { label: '悄悄翻你的包/垃圾桶', scores: { P: 2, B: 1 } },
    ],
    quote: '"What a dog does alone is its truest self."',
  },
  {
    id: 13,
    question: 'Q13: 你给它穿衣服时？',
    options: [
      { label: '全程配合，像个模特', scores: { T: 2, R: 1 } },
      { label: '不情愿，但最终妥协', scores: { S: 2, M: 1 } },
      { label: '穿好后原地静止，一动不动装死', scores: { F: 2, I: 1 } },
      { label: '立刻开始脱，任何布料都是挑战', scores: { B: 2, D: 1 } },
    ],
    quote: '"The way they wear clothes reveals how they wear their soul."',
  },
  {
    id: 14,
    question: 'Q14: 玩玩具时，它的风格？',
    options: [
      { label: '3分钟内咬烂，解剖研究', scores: { D: 2, Z: 1 } },
      { label: '温柔对待，玩具能用很久', scores: { S: 2, R: 1 } },
      { label: '要你陪它玩，不然没意思', scores: { M: 2, E: 1 } },
      { label: '把玩具藏起来，不让你拿走', scores: { P: 2, C: 1 } },
    ],
    quote: '"Play is the most honest window into a dog\'s mind."',
  },
  {
    id: 15,
    question: 'Q15: 吃饭时的表现？',
    options: [
      { label: '飞速吃完，还在原地盯着你要更多', scores: { G: 2, F: 1 } },
      { label: '优雅进食，吃完碗还是干净的', scores: { R: 2, S: 1 } },
      { label: '挑食，不喜欢的不吃', scores: { R: 1, C: 1, I: 1 } },
      { label: '边吃边玩，把粮弄得到处都是', scores: { Z: 2, B: 1 } },
    ],
    quote: '"The ritual of eating reveals the philosophy of living."',
  },
  {
    id: 16,
    question: 'Q16: 在车上/外出时，它的表现？',
    options: [
      { label: '把头伸出窗外，极度兴奋', scores: { E: 2, B: 1 } },
      { label: '安静趴着，偶尔看窗外', scores: { S: 2, I: 1 } },
      { label: '一直叫，紧张焦虑', scores: { A: 2, F: 1 } },
      { label: '直接睡着，哪都一样', scores: { G: 2, S: 1 } },
    ],
    quote: '"How they face the unknown world speaks of their inner courage."',
  },
  {
    id: 17,
    question: 'Q17: 你做家务时，它会？',
    options: [
      { label: '一直跟着你，你走到哪它到哪', scores: { M: 2, H: 1 } },
      { label: '趁机占领你刚离开的位置', scores: { P: 2, C: 1 } },
      { label: '把你的工具叼走藏起来', scores: { D: 1, Z: 1, P: 1 } },
      { label: '完全不干扰，该干嘛干嘛', scores: { S: 2, G: 1 } },
    ],
    quote: '"The helper who follows your every step has a heart full of devotion."',
  },
  {
    id: 18,
    question: 'Q18: 你责备它时，它的反应？',
    options: [
      { label: '立刻摆出最委屈的表情', scores: { F: 2, M: 1 } },
      { label: '低头认错，尾巴夹起来', scores: { S: 2, T: 1 } },
      { label: '满不在乎，继续干原来的事', scores: { B: 2, G: 1 } },
      { label: '看你一眼，转身就走', scores: { I: 2, C: 1 } },
    ],
    quote: '"How one receives correction reveals the depth of the relationship."',
  },
  {
    id: 19,
    question: 'Q19: 睡觉时，它的位置？',
    options: [
      { label: '非要挤进你被窝，黏着你睡', scores: { M: 2, E: 1 } },
      { label: '有自己固定的地方，规律到位', scores: { R: 2, S: 1 } },
      { label: '今天床上，明天地板，随心所欲', scores: { B: 2, Z: 1 } },
      { label: '在门口/走廊守着，随时警戒', scores: { A: 2, C: 1 } },
    ],
    quote: '"Where a dog chooses to rest is where its heart truly lies."',
  },
  {
    id: 20,
    question: 'Q20: 它和你的关系更像？',
    options: [
      { label: '你的孩子，依赖感极强', scores: { M: 2, H: 1 } },
      { label: '你的同事，各有分工', scores: { T: 2, S: 1 } },
      { label: '你的老大，它说了算', scores: { C: 2, P: 1 } },
      { label: '你的朋友，轻松自在', scores: { G: 2, B: 1 } },
    ],
    quote: '"The bond you share defines the soul connection."',
  },
  {
    id: 21,
    question: 'Q21: 遇到它害怕的事（雷声、鞭炮）？',
    options: [
      { label: '躲进你怀里，颤抖不止', scores: { M: 2, F: 1 } },
      { label: '躲进角落，不发声', scores: { I: 2, S: 1 } },
      { label: '大叫还击，用声音抗争', scores: { A: 2, E: 1 } },
      { label: '皱眉看看，继续睡', scores: { G: 2, S: 1 } },
    ],
    quote: '"How one faces fear reveals the architecture of the soul."',
  },
  {
    id: 22,
    question: 'Q22: 家里来了很多客人时？',
    options: [
      { label: '全场最活跃，逐一问候所有人', scores: { E: 2, F: 1 } },
      { label: '只对熟悉的人热情，陌生人免谈', scores: { I: 2, A: 1 } },
      { label: '躲进卧室，直到客人离开', scores: { I: 2, S: 1 } },
      { label: '到处乱窜，什么东西都要检查', scores: { Z: 2, B: 1 } },
    ],
    quote: '"The social capacity of a dog mirrors its openness to the world."',
  },
  {
    id: 23,
    question: 'Q23: 你给它拍照时？',
    options: [
      { label: '自动摆pose，天生模特', scores: { R: 2, E: 1 } },
      { label: '完全不看镜头，自顾自地溜', scores: { B: 2, I: 1 } },
      { label: '凑近来舔镜头/你的脸', scores: { E: 1, M: 1, F: 1 } },
      { label: '被闪光灯吓到，扭头就跑', scores: { A: 2, F: 1 } },
    ],
    quote: '"Vanity in dogs, as in humans, is just love turned outward."',
  },
  {
    id: 24,
    question: 'Q24: 最后一题：它让你感受最多的是？',
    options: [
      { label: '快乐和活力，每天都被它治愈', scores: { H: 2, G: 1 } },
      { label: '依赖和爱，它好像离不开你', scores: { M: 2, H: 1 } },
      { label: '挑战和刺激，但也很有趣', scores: { Z: 1, D: 1, B: 1 } },
      { label: '安心和稳定，它是你的情绪锚点', scores: { S: 2, T: 1 } },
    ],
    quote: '"The feeling they leave in your heart is the truest measure of their soul."',
  },
];

// ===== 算分逻辑 =====

/**
 * 计算各维度得分总计
 * @param {Array} answers - [{questionId, optionIndex}]
 * @returns {Object} scores - {E:0, I:0, A:0, ...}
 */
function calcScores(answers) {
  const scores = { E:0, I:0, A:0, F:0, S:0, M:0, C:0, G:0, D:0, P:0, Z:0, T:0, R:0, B:0, H:0 };
  answers.forEach(({ questionId, optionIndex }) => {
    const q = QUESTIONS.find(q => q.id === questionId);
    if (!q) return;
    const option = q.options[optionIndex];
    if (!option) return;
    Object.entries(option.scores).forEach(([dim, val]) => {
      scores[dim] = (scores[dim] || 0) + val;
    });
  });
  return scores;
}

/**
 * 从一组维度中取得分最高的
 */
function maxDimension(scores, dims) {
  return dims.reduce((max, d) => (scores[d] || 0) > (scores[max] || 0) ? d : max, dims[0]);
}

/**
 * 根据答题记录匹配狗格
 * @param {Array} answers
 * @returns {Object} personality
 */
function calcPersonality(answers) {
  const scores = calcScores(answers);
  // 5个模型各取最高维度
  const m1 = maxDimension(scores, ['E', 'I', 'A']);
  const m2 = maxDimension(scores, ['F', 'S', 'M']);
  const m3 = maxDimension(scores, ['C', 'G', 'D']);
  const m4 = maxDimension(scores, ['P', 'Z', 'T']);
  const m5 = maxDimension(scores, ['R', 'B', 'H']);

  // 前3主维度组合
  const top3 = [m1, m2, m3].sort().join('+');

  // 精确匹配
  let match = PERSONALITIES.find(p => {
    const pCode = p.code.split('+').sort().join('+');
    return pCode === top3;
  });

  // 若无精确匹配，按特征相似度找最近的
  if (!match) {
    const allDims = [m1, m2, m3, m4, m5];
    let maxScore = -1;
    PERSONALITIES.forEach(p => {
      const pDims = p.code.split('+');
      const overlap = pDims.filter(d => allDims.includes(d)).length;
      if (overlap > maxScore) {
        maxScore = overlap;
        match = p;
      }
    });
  }

  return { personality: match || PERSONALITIES[0], scores, topDims: { m1, m2, m3, m4, m5 } };
}

/**
 * 将 15 维原始得分映射为 5 雷达轴百分比（0-100）
 * 映射逻辑：
 *   social  ← E(外向) + F(戏精)的一半 + H(治愈)的三成
 *   danger  ← A(焦虑) + C(控制)的四成 + D(拆迁)的二成
 *   destroy ← D(拆迁) + Z(疯狗)的一半 + B(街溜)的三成
 *   clingy    ← M(黏人) + H(治愈)的七成 + F(戏精)的三成
 *   mental  ← S(稳定) + T(学霸)的八成 + G(摆烂)的三成 - Z(疯狗)的四成 - F(戏精)的二成
 * @param {Object} scores - 15 维得分 {E:0, I:0, A:0, ...}
 * @returns {Object} {social, danger, destroy, clingy, mental} 均为 5-99 的整数
 */
function calcRadarScores(scores) {
  var s = scores || {};
  var raw = {
    social:  (s.E || 0) * 1.0 + (s.F || 0) * 0.5 + (s.H || 0) * 0.3,
    danger:  (s.A || 0) * 1.0 + (s.C || 0) * 0.4 + (s.D || 0) * 0.2,
    destroy: (s.D || 0) * 1.0 + (s.Z || 0) * 0.5 + (s.B || 0) * 0.3,
    clingy:    (s.M || 0) * 1.0 + (s.H || 0) * 0.7 + (s.F || 0) * 0.3,
    mental:  (s.S || 0) * 1.0 + (s.T || 0) * 0.8 + (s.G || 0) * 0.3 - (s.Z || 0) * 0.4 - (s.F || 0) * 0.2,
  };

  // 将原始值映射到 5-99 区间（maxRaw 估计约 25）
  var maxRaw = 25;
  var clamp = function(v) { return Math.min(99, Math.max(5, Math.round(v / maxRaw * 100))); };
  return {
    social:  clamp(raw.social),
    danger:  clamp(raw.danger),
    destroy: clamp(raw.destroy),
    clingy:    clamp(raw.clingy),
    mental:  clamp(raw.mental),
  };
}

module.exports = { DIMENSIONS, PERSONALITIES, QUESTIONS, calcScores, calcPersonality, calcRadarScores };
