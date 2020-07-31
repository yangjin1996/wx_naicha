// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env:cloud.DYNAMIC_CURRENT_ENV
})
const { uniq } = require('lodash')
const TcbRouter = require('tcb-router')
const db = cloud.database()
const couponCollection = db.collection('coupon')
const userCouponCollection = db.collection('user_coupon')
const userCollection = db.collection('user')
const _ = db.command

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
  app.router('get_coupon',async(ctx) => {
    const now = db.serverDate()
    let list = []
    try{
      list = await couponCollection.where({
        expire:_.gt(now)
      }).get().then(res => res.data)
    }catch(err){
      console.log('get_coupon',err)
    }
    ctx.body = list
  })
  app.router('get_user_coupon',async(ctx) => {
    if(!ctx.userId){
      ctx.body = []
      return
    }
    let list = []
    try{
      const now = db.serverDate()
      list = await userCouponCollection.where({
        userId:ctx.userId,
        isUse:false,
        expire:_.gt(now)
      }).get().then(res => res.data)
      let couponIds = list.map(item => item.couponId)
      couponIds = uniq(couponIds)
      const coupon = await couponCollection.where({
        _id:_.in(couponIds)
      }).field({
        money:true,
        orderTotal:true
      }).get().then(res => res.data)
      list = list.map(item => {
        item.coupon = {}
        const index = coupon.findIndex(val => val._id == item.couponId)
        if(index > -1){
          Reflect.deleteProperty(coupon[index],'_id')
          item.coupon = coupon[index]
        }
        return item
      })
    }catch(err){
      console.log('get_user_coupon',err)
    }
    ctx.body = list
  })
  return app.serve()
}