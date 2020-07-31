// components/list/buy-number/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    buyNumber:Number,
    goodsId:Number
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    editCart(e){
      const goodsId = parseInt(e.currentTarget.dataset.goodsId)
      const type = parseInt(e.currentTarget.dataset.type)
      this.triggerEvent('nctap',{goodsId,type})
    }
  }
})
