// components/list/cart/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    cart:Array
  },
  observers:{
    cart(val){
      let total = 0
      val.forEach(item => {
        total += item.goodsPrice * item.buyNumber
      })
      this.setData({
        cartTotal:total
      })
      if(val.length === 0){
        this.setData({
          showList:false
        })
      }
    }
  },
  /**
   * 组件的初始数据
   */
  data: {
    cartTotal:0,
    showList:false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    toggleCartList(){
      if(this.properties.cart.length === 0){
        return
      }
      this.setData({
        showList:!this.data.showList
      })
    },
    hideCartList(){
      this.setData({
        showList:false
      })
    },
    editCart (e){
      this.triggerEvent('editCart',e.detail)
    },
    cartSubmit (e){
      this.triggerEvent('submit')
    }
  }
})
