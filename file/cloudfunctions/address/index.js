// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env:cloud.DYNAMIC_CURRENT_ENV
})

const TcbRouter = require('tcb-router')
const db = cloud.database()
const addressCollection = db.collection('address')
const { isObject, isEmpty } = require('lodash')
const _ = db.command
const MAX_ADDRESS_NMU = 5

async function updateDefaultAddress (id,openid){
  const where = {
    _id:_.neq(id),
    openid,
    isDefault:true
  }
  console.log('updateDefaultAddress:',where)
  await addressCollection.where(where).update({
    data:{
      isDefault:false
    }
  })
}

// 云函数入口函数
exports.main = async (event, context) => {
  const app = new TcbRouter({ event })
  const { OPENID } = cloud.getWXContext()
  app.use(async(ctx,next) => {
    ctx.openid = OPENID
    await next()
  })
  app.router('list',async (ctx) => {
    const list = await addressCollection.where({
      openid:ctx.openid
    }).get().then(res => res.data)
    ctx.body = list
  })

  app.router('default',async(ctx) => {
    const list = await addressCollection.where({
      openid:ctx.openid,
    }).orderBy('createTime','desc').get().then(res => res.data)
    if(list.length === 0){
      ctx.body = {}
    }else {
      const row = list.filter(item => item.isDefault)
      if(row.length === 0){
        ctx.body = list[0]
      }else{
        ctx.body = row[0]
      }
    }
  })

  app.router('row',async (ctx) => {
    const id = event.id || ''
    if(!id){
      ctx.body = {
        success:0,
        message:'参数错误'
      }
    }else{
      try{
        const row = await addressCollection.doc(id).get().then(res => res.data)
        ctx.body = {
          success:1,
          data:row
        }
      }catch (err){
        console.log(err)
        ctx.body = {
          success:0,
          message:'查询失败'
        }
      }
    }
  })

  app.router('add',async (ctx) => {
    const address = event.address || {}
    if(!isObject(address) || isEmpty(address)){
      ctx.body = {
        success:0,
        message:'参数错误'
      }
    }else{
      try{
        const count = await addressCollection.where({
          openid:ctx.openid
        }).count().then(res => res.data)
        if(count >= MAX_ADDRESS_NMU) {
          ctx.body = {
            success:0,
            message:'最多保存' + MAX_ADDRESS_NMU + '条地址'
          }
        }else{
          var res = await addressCollection.add({
            data:{
              ...address,
              openid:ctx.openid,
              createTime:db.serverDate()
            }
          })
        }
      }catch(err){
        console.log(err)
        ctx.body = {
          success:0,
          message:'添加失败'
        }
      }
      //如果当前是默认地址，把其他的地址修改为非默认
      const curAddressId = res._id
      await updateDefaultAddress(curAddressId,ctx.openid)
      ctx.body = {
        success:1,
        addressId:curAddressId
      }
    }
  })

  app.router('update',async (ctx) => {
    const address = event.address || {}
    const id = event.id || ''
    if(!isObject(address) || isEmpty(address) || !id){
      ctx.body = {
        success:0,
        message:'参数错误'
      }
    }else{
      try{
        const row = await addressCollection.where({
          _id:id,
          openid:ctx.openid
        }).get().then(res => res.data)
        if(row.length === 0){
          ctx.body = {
            success:0,
            message:'不允许修改'
          }
        }else{
          var res = await addressCollection.doc(id).update({
            data:{
              ...address,
              createTime:db.serverDate()
            }
          })
        }
      }catch(err){
        console.log(err)
        ctx.body = {
          success:0,
          message:'修改失败'
        }
      }
      //如果当前是默认地址，把其他的地址修改为非默认
      await updateDefaultAddress(id,ctx.openid)
      ctx.body = {
        success:1,
      }
    }
  })

  app.router('delete',async(ctx) => {
    const id = event.id ||  ''
    if(!id){
      ctx.body = {
        success:0,
        message:'参数错误'
      }
      return
    }
    try{
      const row = await addressCollection.where({
        _id:id,
        openid:ctx.openid
      }).get().then(res => res.data)
      if(row.length === 0){
        ctx.body = {
          success:0,
          message:'不允许删除'
        }
        return
      }
      await addressCollection.doc(id).remove()
    }catch(err){
      console.log('delete-error',err)
      ctx.body = {
        success:0,
        message:'删除失败'
      }
    }
    ctx.body = {
      success:1,
      message:'删除成功'
    }
  })
  return app.serve()
}