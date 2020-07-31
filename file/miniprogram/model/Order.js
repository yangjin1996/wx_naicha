class Order {
  static async add(data){
    return await wx.cloud.callFunction({
      name:'order',
      data:{
        $url:'add',
        ...data
      }
    }).then(res => res.result)
  }
  static async page(status,start,count){
    return await wx.cloud.callFunction({
      name:'order',
      data:{
        $url:'list',
        status,
        start,
        count
      }
    }).then(res => res.result)
  }
  static async count(status = -1){
    return await wx.cloud.callFunction({
      name:'order',
      data:{
        $url:'count',
        status
      }
    }).then(res => res.result)
  }
}
export {
  Order
}