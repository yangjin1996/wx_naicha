// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})
const axios = require('axios')
// axios.defaults.baseURL = 'http://api.2yue.cc/index.php/';
axios.defaults.timeout = 20000;
axios.defaults.headers.appkey = 'f68bSYqte0m6EibwhARrzTcYDPoV0FobCi06uDfM3eF4QGQQKSywmd71ytM';
const db = cloud.database()
const goodsCollection = db.collection('goods')
const categoryCollection = db.collection('category')
const loadGoodsUrl = 'http://api.4yue.top/index.php/api/goods_list2?type=1'
const loadGoodsTotalUrl = 'http://api.4yue.top/index.php/api/goods_count?type=1'
const loadCategoryUrl = 'http://api.4yue.top/index.php/api/goods_category_all?type=1'

// 云函数入口函数
exports.main = async (event, context) => {
  let count = 20
  const total = await axios.get(loadGoodsTotalUrl).then(res => {
    res = res.data
    if(res.error_code == 0){
      return res.data
    }else{
      return 0
    }
  })
  let totalPage = Math.ceil(total/count)
  let list = []
  for(let page = 1;page <= totalPage;page++){
    const res = await axios.get(loadGoodsUrl,{
      params:{
        page,
        count
      }
    }).then(res => {
      res = res.data
      if(res.error_code == 0){
        return res.data.goods
      }else{
        return []
      }
    })
    list = list.concat(res)
  }
  if(list.length > 0){
    for(let key in list){
      const data = {
        ...list[key],
        createTime:db.serverDate()
      }
      const row = await goodsCollection.where({
        goods_id:list[key].goods_id
      }).get().then(res => res.data)
      if(row.length === 0){
        await goodsCollection.add({
          data
        })
      }else{
        await goodsCollection.where({
          goods_id:list[key].goods_id
        }).update({
          data
        })
      }
    }
  }
  
  const category = await axios.get(loadCategoryUrl).then(res => {
    res = res.data
    if(res.error_code == 0){
      return res.data
    }else{
      return []
    }
  })
  if(category.length > 0){
    for(let key in category){
      const data = {
        ...category[key],
        createTime:db.serverDate()
      }
      const row = await categoryCollection.where({
        cat_id:category[key].cat_id
      }).get().then(res => res.data)
      if(row.length === 0){
        await categoryCollection.add({
          data
        })
      }else{
        await goodsCollection.where({
          cat_id:list[key].cat_id
        }).update({
          data
        })
      }
    }
  }
}