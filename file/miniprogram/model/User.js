class User {
  static async getDetail (){
    let user = await wx.cloud.callFunction({
      name:'user',
      data:{
        $url:'detail'
      }
    }).then(res => res.result)
    if(!user.nickName){
      return new Promise((resolve,reject) => {
        wx.getUserInfo({
          success: res => {
            if(res.userInfo){
              user = Object.assign(res.userInfo,user)
              resolve(user)
            }
          }
        })
      })
    }
    return user
  }
  static async update (userId,data){
     return await wx.cloud.callFunction({
      name:'user',
      data:{
        $url:'update',
        user:data,
        userId
      }
    }).then(res => res.result)
  }
}

export {
  User
}