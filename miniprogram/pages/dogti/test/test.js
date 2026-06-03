const { QUESTIONS, calcPersonality, calcRadarScores } = require('../data/dgti-data');

// 题目对应的场景 emoji
const QUESTION_EMOJIS = ['📦','🌳','🚪','🛁','🦴','🏠','📚','😔','👂','🦮','🤝','🧸','👗','🎾','🍗','🚗','🧹','😤','💤','🛌','💝','⛈️','🎉','💭'];

Page({
  data: {
    questions: [],
    currentIndex: 0,
    total: 0,
    currentQuestion: null,
    selectedIndex: -1,
    progressPercent: 0,
    optionLetters: ['A', 'B', 'C', 'D'],
    answers: [], // [{questionId, optionIndex}]
    statusBarHeight: 20
  },

  onLoad() {
    const questions = QUESTIONS.map((q, i) => ({
      ...q,
      emoji: QUESTION_EMOJIS[i] || '🐾',
    }));
    this.setData({
      questions,
      total: questions.length,
      currentQuestion: questions[0],
      progressPercent: Math.round(1 / questions.length * 100),
    });

    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight || 20
      });
    } catch (err) {
      console.error('读取状态栏高度失败：', err);
      this.setData({ statusBarHeight: 20 });
    }
  },

  goBack() {
    wx.navigateBack();
  },

  selectOption(e) {
    const { index } = e.currentTarget.dataset;
    if (this.data.selectedIndex !== -1) return; // 防止重复点击

    this.setData({ selectedIndex: index });

    // 记录答案并自动切换下一题
    this.setData({ selectedIndex: index });

    const { currentIndex, currentQuestion, answers } = this.data;
    const newAnswers = [...answers, { questionId: currentQuestion.id, optionIndex: index }];

    setTimeout(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= this.data.questions.length) {
        const result = calcPersonality(newAnswers);
        const radar = calcRadarScores(result.scores);
        wx.navigateTo({
          url: `/pages/dogti/result/result?id=${result.personality.id}&scores=${encodeURIComponent(JSON.stringify(result.scores))}&radar=${encodeURIComponent(JSON.stringify(radar))}`,
        });
      } else {
        const nextQuestion = this.data.questions[nextIndex];
        this.setData({
          currentIndex: nextIndex,
          currentQuestion: nextQuestion,
          selectedIndex: -1,
          answers: newAnswers,
          progressPercent: Math.round((nextIndex + 1) / this.data.total * 100),
        });
      }
    }, 300);
  },

  // 上一题
  prevQuestion() {
    const { currentIndex, answers } = this.data;
    if (currentIndex <= 0) return;

    // 移除当前题的答案（回退时撤销上次选择）
    const newAnswers = answers.slice(0, -1);
    const prevIndex = currentIndex - 1;
    const prevQuestion = this.data.questions[prevIndex];

    // 恢复上一次的选中状态（如果有的话）
    const lastAnswer = newAnswers.length > 0 ? newAnswers[newAnswers.length - 1] : null;
    const restoredSelected = (lastAnswer && lastAnswer.questionId === prevQuestion.id)
      ? lastAnswer.optionIndex
      : -1;

    this.setData({
      currentIndex: prevIndex,
      currentQuestion: prevQuestion,
      selectedIndex: restoredSelected,
      answers: newAnswers,
      progressPercent: Math.round((prevIndex + 1) / this.data.total * 100),
    });
  },
});
