//app.js
import {getConfig} from './utils/function.js'
import {Login} from './model/Login.js'
import {Token} from './storage/Token.js'
const AUTH_LOGIN_KEY = getConfig('app.auth_login_key')
const tokenStorage = new Token()
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'naicha-ucth0',
        traceUser: true,
      })
    }

    //处理登陆
    // wx.login({
    //   success:res => {
    //     console.log(res);
    //   }
    // })
    wx.getSetting({
      success:res => {
        if(res.authSetting['scope.userInfo']){
          //已经授权,登陆
          this.autoLogin()
          // const token = tokenStorage.getStorage()
          // if(!token){
          //   this.httpLogin()
          // }
        }else{
          wx.setStorageSync(AUTH_LOGIN_KEY, 0)
        }
      }
    })
    this.globalData = {}
  },
  autoLogin (callback){
    wx.cloud.callFunction({
      name:'login'
    }).then(res => {
      res = res.result
      if(res.success === 1){
        wx.setStorageSync(AUTH_LOGIN_KEY, 1)
        wx.setStorageSync('openid',res.openid)
        // wx.showTabBar()
        callback && callback()
      }else {
        wx.setStorageSync(AUTH_LOGIN_KEY,0)
      }
    })
  },
  httpLogin(callback){
    wx.login({
      success:res => {
        console.log(res);
        if(res.code){
          Login.getToken(res.code).then(res => {
            console.log(res)
            if(res.token){
              wx.setStorageSync(AUTH_LOGIN_KEY, 1)
              tokenStorage.setStorage(res.token,2)
              wx.showTabBar()
              callback && callback()
            }
          })
        }
      }
    })
  }
})
