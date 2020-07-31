// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env:cloud.DYNAMIC_CURRENT_ENV
})
const {isEmpty} = require('lodash')
const TcbRouter = require('tcb-router')
const db = cloud.database()
const userCollection = db.collection('user')

// 云函数入口函数
exports.main = async (event, context) => {
  const app = new TcbRouter({ event })
  const { OPENID } = cloud.getWXContext()
  app.use(async(ctx,next) => {
    ctx.openid = OPENID
    const user = await userCollection.where({
      openid:OPENID
    }).get().then(res => res.data)
    ctx.userId = user.length > 0 ? user[0]._id : ''
    await next()
  })

  app.router('detail',async(ctx) => {
    const user = await userCollection.doc(ctx.userId).get().then(res => res.data)
    ctx.body = user
  })

  app.router('update',async(ctx) => {
    const user = event.user
    const userId = event.userId
    if(isEmpty(user) || !userId){
      ctx.body = {
        success:0,
        message:'参数错误'
      }
      return
    }
    try{
      const userInfo = await userCollection.doc(userId).get().then(res => res.data)
      if(isEmpty(userInfo)){
        throw new Error('用户不存在')
      }
      const res = await userCollection.doc(ctx.userId).update({
        data:user
      })
      if(res.stats.updated > 0){
        if(user.avatarUrl && userInfo.avatarUrl){
          await cloud.deleteFile({
            fileList:[userInfo.avatarUrl]
          })
        }
      }else{
        throw new Error('没有修改数据')
      }
    }catch(err){
      console.log('update-err:',err)
      ctx.body = {
        success:0,
        message:'修改失败'
      }
      return
    }
    ctx.body = {
      success:1,
      message:'修改成功'
    }
  })
  return app.serve()
}