// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})
const TcbRouter = require('tcb-router')
const db = cloud.database()
const goodsCollection = db.collection('goods')
const categoryCollection = db.collection('category')

// 云函数入口函数
exports.main = async (event, context) => {
  const app = new TcbRouter({ event })
  app.router('recommend', async (ctx) => {
    const number = event.number || 20
    const list = await goodsCollection.where({
      is_recommend: 1
    }).field({
      goods_id:true,
      goods_img:true,
      goods_name:true,
      goods_price:true,
      max_buy:true,
      stock:true,
      _id:false
    }).orderBy('goods_id','desc').limit(number).get().then(res => res.data)
    ctx.body = list
  })

  app.router('new', async (ctx) => {
    ctx.body = {
      data:'新品'
    }
  })
  //获取商品分类
  app.router('category',async (ctx) => {
    const parentId = parseInt(event.parentId || 0)
    const res = await categoryCollection.where({
      parent_id:parentId
    }).field({
      _id:false,
      cat_id:true,
      cat_name:true
    }).get().then(res => res.data)
    ctx.body = res
  })
  //分页获取数据
  app.router('list',async (ctx) => {
    const number = event.number || 10
    const offset = event.offset || 0
    const isRecommend = event.isRecommend || 0
    const isSales = event.isSales || 0
    const pid = event.pid || 0
    const where = {}
    if(isRecommend == 1){
      where.is_recommend = 1
    }
    if(isSales == 1){
      where.is_sales = 1
    }
    if(pid > 0){
      where.pcat_id = pid
    }
    const list = await goodsCollection.where(where).field({
      goods_id:true,
      goods_img:true,
      goods_name:true,
      goods_price:true,
      max_buy:true,
      stock:true,
      _id:false
    }).orderBy('goods_id','desc').skip(offset).limit(number).get().then(res => res.data)
    ctx.body = list
  })
  return app.serve()
  // //获取推荐商品
  // const type = event.type
  // if(type === 'recommend'){
  //   return {
  //     data:'推荐商品',
  //     params:event
  //   }
  // }else if(type === 'new'){
  //   //获取新品
  //   return {
  //     data:'新品'
  //   }
  // } 
}