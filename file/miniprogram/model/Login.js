import { Http } from '../utils/Http.js'
import {getConfig} from '../utils/function.js'
const {appId,appSecret} = getConfig('app')
class Login {
  static getToken (code) {
    return Http.request({
      url:'api/token/user',
      method:'POST',
      data:{
        code,
        appId,
        appSecret
      }
    }).then(res => {
      return Promise.resolve(res)
    }).catch(err => {
      wx.showToast({
        title:err,
        icon:'none'
      })
    })
  }
}
export {
  Login
}