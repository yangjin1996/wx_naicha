import {User} from '../../model/User.js'
import {dateFormat} from '../../utils/function.js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo:{}
  },
  async getUser (){
    const user = await User.getDetail()
    console.log('user',user)
    this.setData({
      userInfo:user
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getUser()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },
  changeAvater(){
    wx.chooseImage({
      count:1,
      success:res => {
        console.log(res)
        const avatarTempPath = res.tempFilePaths[0]
        //上传图片到云存储
        wx.showLoading({
          title: '正在上传头像',
          mask:true
        })
        const cloudPath = 'user-avatar/' + dateFormat('YYYY-mm-dd',new Date()) + '/' + Date.now()  + avatarTempPath.substr(avatarTempPath.lastIndexOf('.'))
        wx.cloud.uploadFile({
          cloudPath,
          filePath:avatarTempPath
        }).then(res => {
          if(res.fileID){
            //修改用户头像
            const avatarUrl = res.fileID
            User.update(this.data.userInfo._id,{avatarUrl}).then(res => {
              console.log(res)
              if(res.success === 1){
                this.setData({
                  'userInfo.avatarUrl':avatarUrl
                })
              }else{
                wx.showToast({
                  title:res.message,
                  icon:'none'
                })
              }
            }).finally(() => {
              wx.hideLoading()
            })
          }
        })
      },
    })
  },
  jumpMenu(e){
    const url = e.currentTarget.dataset.url
    if(!url){
      return
    }
    wx.navigateTo({
      url
    })
  }
})