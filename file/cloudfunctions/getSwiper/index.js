// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})
const axios = require('axios')
axios.defaults.baseURL = 'http://api.4yue.top/index.php/';
axios.defaults.timeout = 10000;
axios.defaults.headers.appkey = 'f68bSYqte0m6EibwhARrzTcYDPoV0FobCi06uDfM3eF4QGQQKSywmd71ytM';
const db = cloud.database()
const swiperCollection = db.collection('swiper')
// const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  //查询swiper数据库的数据
  let isFetch = false
  let res = await swiperCollection.orderBy('createTime','desc').get().then(res => res.data)
  if(res.length === 0){
    isFetch = true
  }else{
    const maxTime = new Date(res[0].createTime).getTime()
    if(Date.now() - maxTime > 3600*1000*24){
      isFetch = true
    }
  }
  if(isFetch){
    res = await axios.get('api/swiper').then(res => {
      res = res.data
      if(res.error_code == 0){
        return res.data
      }else{
        return []
      }
    })
    if(res.length > 0){
      for(let key in res){
        const data = {
          ...res[key],
          createTime:db.serverDate()
        }
        const row = await swiperCollection.where({
          id:res[key].id
        }).get().then(res => res.data)
        if(row.length === 0){
          await swiperCollection.add({
            data
          })
        }else{
          await swiperCollection.where({
            id:res[key].id
          }).update({
            data
          })
        }
      }
    }
  }
  return res
}