// components/list/address/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    address: Object
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
    chooseAddress(){
      // wx.chooseAddress({
      //   success:res => {
      //     console.log(res)
      //   }
      // })
      wx.navigateTo({
        url:'/pages/address/address?from=list',
      })
    }
  }
})
