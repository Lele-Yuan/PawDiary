Component({
  properties: {
    currentPet: {
      type: Object,
      value: null
    },
    pets: {
      type: Array,
      value: []
    }
  },

  data: {
    showPicker: false,
    globalPetId: ''
  },

  lifetimes: {
    attached() {
      const app = getApp();
      this.setData({ globalPetId: app.globalData.currentPetId || '' });
    }
  },

  methods: {
    openPicker() {
      // 每次打开时同步最新的 globalData 当前宠物
      const app = getApp();
      this.setData({
        showPicker: true,
        globalPetId: app.globalData.currentPetId || ''
      });
      if (this.data.pets.length <= 1) {
        this.setData({ showPicker: false });
        return;
      }
    },

    closePicker() {
      this.setData({ showPicker: false });
    },

    onPickPet(e) {
      const petId = e.currentTarget.dataset.petId;
      this.setData({ showPicker: false });
      if (petId && (!this.data.currentPet || petId !== this.data.currentPet._id)) {
        this.triggerEvent('switch', { petId });
      }
    },

    noop() {}
  }
});
