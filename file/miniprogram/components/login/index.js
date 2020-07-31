import {getConfig} from '../../utils/function.js'
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    
  },
  lifetimes:{
    attached(){
      const AUTH_LOGIN_KEY = getConfig('app.auth_login_key')
      const isLogin = wx.getStorageSync(AUTH_LOGIN_KEY)
      let showLogin
      if(isLogin === 0){
        wx.hideTabBar()
        showLogin = true
      } else {
        wx.showTabBar()
        showLogin = false
      }
      this.setData({
        showLogin
      })
    }
  },
  /**
   * 组件的初始数据
   */
  data: {
    showLogin:false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    getUserInfo(e){
      if(e.detail.userInfo){
        //允许授权
        getApp().autoLogin(() => {
          this.setData({
            showLogin:false
          })
        })
      }else{
        //拒绝授权
      }
    }
  }
})
