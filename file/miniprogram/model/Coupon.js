class Coupon {
  //获取优惠活动
  static async getCoupon(){
    return await wx.cloud.callFunction({
      name:'coupon',
      data:{
        $url:'get_coupon'
      }
    }).then(res => res.result)
  }
  static async getUserCoupon(){
    return await wx.cloud.callFunction({
      name:'coupon',
      data:{
        $url:'get_user_coupon'
      }
    }).then(res => res.result)
  }
}
export {
  Coupon
}