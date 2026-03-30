Component({
  properties: {
    pets: {
      type: Array,
      value: []
    },
    currentPetId: {
      type: String,
      value: ''
    }
  },

  methods: {
    onSelectPet(e) {
      const petId = e.currentTarget.dataset.id;
      if (petId !== this.properties.currentPetId) {
        this.triggerEvent('switch', { petId });
      }
    },

    onAddPet() {
      wx.navigateTo({
        url: '/pages/pet-edit/pet-edit?mode=add'
      });
    }
  }
});