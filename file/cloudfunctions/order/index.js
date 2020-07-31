// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env:cloud.DYNAMIC_CURRENT_ENV
})
const { isEmpty,random } = require('lodash')
const TcbRouter = require('tcb-router')
const db = cloud.database()
const orderCollection = db.collection('order')
const addressCollection = db.collection('address')
const userCouponCollection = db.collection('user_coupon')
const couponCollection = db.collection('coupon')
const goodsCollection = db.collection('goods')
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

  app.router('count',async(ctx) => {
    let status = parseInt(event.status)
    if(isNaN(status)){
      status = -1
    }
    const where = {
      userId:ctx.userId
    }
    if(status > -1){
      where.status = status
    }
    const count = await orderCollection.where(where).count().then(res => res.total)
    ctx.body = count
  })

  app.router('add',async(ctx) => {
    const addressId = event.addressId || ''
    const goods = event.goods || []
    const userCouponId = event.userCouponId || ''
    if(!addressId || goods.length === 0){
      ctx.body = {
        success:0,
        message:'参数错误'
      }
      return
    }
    try{
      let address = await addressCollection.where({
        _id:addressId,
        openid:ctx.openid
      }).get().then(res => res.data)
      if(isEmpty(address)){
        console.log('地址不存在')
        ctx.body = {
          success:0,
          message:'地址不存在'
        }
        return
      }
      console.log('地址存在')
      const goodsIds = goods.map(item => item.goodsId)
      console.log('goods',goods)
      const buyGoods = await goodsCollection.where({
        goods_id:_.in(goodsIds)
      }).field({
        _id:false,
        goods_id:true,
        goods_img:true,
        goods_name:true,
        goods_price:true,
        stock:true
      }).get().then(res => res.data)
      var orderTotal = 0
      var orderGoods = []
      console.log('buyGoods',buyGoods)
      for(let i in goods){
        const item = goods[i]
        let row = buyGoods.filter(val => val.goods_id == item.goodsId)
        if(row.length === 0){
          ctx.body = {
            success:0,
            message:'ID为' + item.goodsId + '的商品不存在'//item.goodsId
          }
          return
        }
        console.log('row',row)
        row= row[0]
        if(item.buyNumber > row.stock){
          ctx.body = {
            success:0,
            message:`[${row.goods_name}]的库存不足`
          }
          return
        }
        orderTotal += item.buyNumber * row.goods_price
        Reflect.deleteProperty(row,'stock')
        orderGoods.push({
          ...row,
          buyNumber:item.buyNumber
        })
      }
      var couponMoney = 0
      if(userCouponId){
        const now = db.serverDate()
        var userCoupon = await userCouponCollection.where({
          _id:userCouponId,
          userId:ctx.userId,
          isUse:false,
          expire:_.gt(now)
        }).get().then(res => res.data)
        if(isEmpty(userCoupon)){
          ctx.body = {
            success:0,
            message:'优惠券不存在'
          }
          return
        }
        userCoupon = userCoupon[0]
        var coupon = await couponCollection.doc(userCoupon.couponId).get().then(res => res.data)
        if(coupon.orderTotal > orderTotal){
          ctx.body = {
            success:0,
            message:'订单需要满' + coupon.orderTotal + '元才能使用',
          }
          return
        }
        couponMoney = coupon.money
      }
      address = address[0]
      //组装订单数据
      const orderTestStatus = random(0,2) //0待支付 1已支付 2已发货 3已完成
      const data = {
        userId:ctx.userId,
        consignee:address.name,
        phone:address.phone,
        adress:address.region[0] + address.region[1] + address.region[2] + address.detail,
        orderTotal,
        actualPayment:orderTotal - couponMoney,
        couponMoney,
        status:orderTestStatus,
        createTime:db.serverDate(),
        goods:orderGoods
      }
      switch (orderTestStatus){
        case 1:data.payTime = db.serverDate();break;
        case 2:data.sendTime = db.serverDate();break;
      }
      const result = await db.runTransaction(async transaction => {
        const res = await orderCollection.add({
          data
        })
        if(res._id){
          //修改库存
          for(let i=0;i<orderGoods.length;i++){
            const r1 = await transaction.collection('goods').where({
              goods_id:orderGoods[i].goods_id
            }).update({
              data:{
                stock:_.inc(-1 * orderGoods[i].buyNumber)
              }
            })
            const r2 = await transaction.collection('cart').where({
              goodsId:orderGoods[i].goods_id,
              _openid:ctx.openid
            }).remove()
            if(!r1.stats.updated || !r2.stats.removed){
              await transaction.rollback({
                success:0,
                message:'操作失败'
              })
              break
            }
          }
          //如果使用了优惠券，修改优惠券的状态等信息
          if(userCouponId != '' && data.couponMoney > 0){
            const r3 = await transaction.collection('user_coupon').doc(userCouponId).update({
              data:{
                isUse:true,
                orderId:res._id,
                useTime:db.serverDate()
              }
            })
            if(!r3.stats.updated){
              await transaction.rollback({
                success:0,
                message:'操作失败'
              })
            }
          }
          return {
            success:1,
            message:'操作成功'
          }
        }else{
          return {
            success:0,
            message:'操作失败'
          }
        }
      })
      ctx.body = result

    }catch(err){
      console.log('add-err',err)
      ctx.body = {
        success:0,
        message:'操作失败'
      }
      return
    }
  })

  app.router('list',async(ctx) => {
    const status = parseInt(event.status)
    if(isNaN(status)){
      status = -1
    }
    const start = parseInt(event.start || 0)
    let count = parseInt(event.count || 20)
    count = count > 20 ? 20 : count
    const where = {
      userId:ctx.userId
    }
    if(status > -1){
      where.status = status
    }
    const list = await orderCollection.where(where).orderBy('createTime','desc').skip(start).limit(count).get().then(res => res.data)
    ctx.body = list
  })

  app.router('addCartAll',async(ctx) => {
    const data = event.data || []
    if(!Array.isArray(data) || data.length === 0){
      return false
    }
    try{
      const result = await db.runTransaction(async transation => {
        const res = []
        for(let k in data) {
          const r = await transation.collection('cart').add({
            data:{
              ...data[k],
              _openid:ctx.openid,
              createTime:db.serverDate()
            }
          })
          if(r._id){
            res.push(r._id)
          }
        }
        if(res.length != data.length){
          transation.rollback(0)
        }else {
          return res.length
        }
      })
      ctx.body = result > 0
    }catch(err){
      console.log('err',err)
      ctx.body = false
    }
  })

  app.router('removeQuickGoods',async(ctx) => {
    try{
      const res = await db.collection('cart').where({
        isQuick:true
      }).reomve()
      console.log('removeQuickGoods',res.stats.removed);
    }catch(err){
      console.log(err)
      ctx.body = false
      return
    }
    ctx.body = true
  })
  return app.serve()
}