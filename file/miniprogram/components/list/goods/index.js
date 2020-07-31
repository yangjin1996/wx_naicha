// components/list/goods/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    goods:Array,
    title:String
  },

  /**
   * 组件的初始数据
   */
  data: {
    number:0
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onScrolltolower(){
      this.triggerEvent('loadMore')
    },
    editCart (e){
      this.triggerEvent('editCart',e.detail)
    }
  }
})
