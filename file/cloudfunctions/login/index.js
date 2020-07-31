// 云函数模板
// 部署：在 cloud-functions/login 文件夹右击选择 “上传并部署”

const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const userCollection = db.collection('user')
/**
 * 这个示例将经自动鉴权过的小程序用户 openid 返回给小程序端
 * 
 * event 参数包含小程序端调用传入的 data
 * 
 */
exports.main = async (event, context) => {

  // 可执行其他自定义逻辑
  // console.log 的内容可以在云开发云函数调用日志查看

  // 获取 WX Context (微信调用上下文)，包括 OPENID、APPID、及 UNIONID（需满足 UNIONID 获取条件）等信息
  const { OPENID } = cloud.getWXContext()
  const user = await userCollection.where({
    openid:OPENID
  }).get().then(res => res.data)
  let res
  try{
    if(user.length === 0){
      res = await userCollection.add({
        data:{
          openid:OPENID,
          lastLoginTime:db.serverDate(),
          createTime:db.serverDate()
        }
      })
    }else{
      res = await userCollection.doc(user[0]._id).update({
        data:{
          lastLoginTime:db.serverDate()
        }
      })
    }
  } catch (err){
    res = false
    console.log(err)
  }
  if(res){
    return {
      'success':1,
      'openid':OPENID
    }
  }else{
    return {
      'success':0 
    }
  }
}

