const { calcAge } = require('../../../../utils/util');

Component({
  properties: {
    pet: {
      type: Object,
      value: {}
    },
    statusBarHeight: {
      type: Number,
      value: 20
    }
  },

  data: {
    age: '',
    companionDays: 0
  },

  observers: {
    'pet': function (pet) {
      if (pet && pet.name) {
        const age = calcAge(pet.birthday) || '';
        let companionDays = 0;
        if (pet.adoptDate) {
          // 统一按本地日期（年月日）计算，消除 UTC 时区偏移带来的误差
          const raw = pet.adoptDate;
          let adoptD;
          if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
            const p = raw.split('-');
            adoptD = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
          } else {
            const d = new Date(raw);
            adoptD = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          }
          const today = new Date();
          const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const diffMs = todayMidnight.getTime() - adoptD.getTime();
          companionDays = diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;
        }
        this.setData({ age, companionDays });
      }
    }
  },

  methods: {
    onLongPress() {
      if (this.properties.pet && this.properties.pet._id) {
        this.triggerEvent('edit', { petId: this.properties.pet._id });
      }
    }
  }
});