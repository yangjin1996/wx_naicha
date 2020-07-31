import {getConfig, isEmptyObject} from '../../utils/function.js'
import {Cart} from '../../model/Cart.js'
import {Coupon} from '../../model/Coupon.js'
import { Order } from '../../model/Order.js'
const AUTH_LOGIN_KEY = getConfig('app.auth_login_key')
const ADDRESS_STORE_NAME = getConfig('storage.selectAddress')
const cartModel = new Cart()
let quickBuy = 0
let userSelectCouponId = ''
Page({

  /**
   * 页面的初始数据
   */
  data: {
    address:{},
    cart:[],
    goods:[],
    couponMoney:0,
    orderTotal:0,
    actualPayment:0,
    checkboxImg:{
      default:"/images/checkbox.png",
      checked:'/images/checkbox@selected.png'
    }
  },
  async checkAuth(){
    const isLogin = wx.getStorageSync(AUTH_LOGIN_KEY)
    if(isLogin != 1){
      wx.switchTab({
        url:'/pages/home/home'
      })
      return
    }
    const address = wx.getStorageSync(ADDRESS_STORE_NAME)
    
    if(isEmptyObject(address)){
      wx.showToast({
        title: '请选择地址',
        icon:'none',
        success:() => {
          wx.switchTab({
            url: '/pages/list/list',
          })
        }
      })
      return
    }
    const cart = await cartModel.getCart(0,quickBuy)
    if(cart.length === 0){
      wx.showToast({
        title: '请选择商品',
        icon:'none',
        success:() => {
          wx.switchTab({
            url: '/pages/list/list',
          })
        }
      })
      return
    }
    let orderTotal = 0
    cart.forEach(item => {
      orderTotal += item.buyNumber * parseFloat(item.goodsPrice)
    })
    this.setData({
      address,
      cart,
      orderTotal,
      actualPayment:orderTotal
    })
  },
  async getCoupon(){
    const coupon = await Coupon.getCoupon()
    let userCoupon = await Coupon.getUserCoupon()
    console.log(coupon,userCoupon)
    userCoupon = userCoupon.map(item => {
      item.selected = false
      return item
    })
    this.setData({
      userCoupon,
      coupon
    })
  },
  async editCart(e){
    // wx.showLoading({
    //   title: '操作中',
    //   mask:true 
    // })
    // console.log(e)
    // const goodsId = e.detail.goodsId//list.js中为detail
    // const type = parseInt(e.detail.type)
    // if(type === 1){
    //   await this.updateCart(goodsId)
    // }else{
    //   await this.reduceCart(goodsId)
    // }
    // wx.hideLoading()
  },
  async updateCart(goodsId){
    let cartList = this.data.cart
    let index = cartList.findIndex(item => item.goodsId == goodsId)
    if(index === -1){
      wx.showToast({
        title:'参数错误',
        icon:'none'
      })
      return
    }
    const cart = cartList[index]
    const buyNumber = cart.buyNumber + 1
    const res =  await cartModel.updateCartBuyNumber(goodsId,buyNumber)
    if(res){
      wx.showToast({
        title: '操作成功',
      })
      cartList[index].boyNumber = boyNumber
      this.setData({
        cart:cartList
      })
    }else{
      wx.showToast({
        title: '操作失败',
        icon:'none'
      })
    }
  },
  async reduceCart(goodsId){
    let goods = this.data.goods.filter(item => item.goods_id == goodsId)
    if(goods.length === 0){
      wx.showToast({
        title:'参数错误',
        icon:'none'
      })
      return
    }
    goods = goods[0]
    const cart = await cartModel.getCart(goodsId)
    if(cart.length === 0){
      wx.showToast({
        title:'操作失败',
        icon:'none'
      })
      return
    }
    let res
    if(cart[0].buyNumber === 1){
      res = await cartModel.removeCartByGoodsId(goodsId)
    }else{
      const buyNumber = cart[0].buyNumber - 1
      res = await cartModel.updateCartBuyNumber(goodsId,buyNumber)
    }
    if(res){
      wx.showToast({
        title: '操作成功',
      })
      this.reformGoods()
    }else{
      wx.showToast({
        title: '操作失败',
        icon:'none'
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    quickBuy = parseInt(options.quick || 0)
    this.checkAuth()
    this.getCoupon()
    this.editCart()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },
  chooseCoupon(e){
    console.log(e)
    const id = e.detail.key
    const selected = e.detail.checked
    let userCoupon = this.data.userCoupon
    const index = userCoupon.findIndex(item => item._id === id)
    const selectCoupon = userCoupon[index]
    if(selectCoupon.coupon.orderTotal > 0 && this.data.orderTotal < selectCoupon.coupon.orderTotal){
      wx.showToast({
        title: '订单需要满' + selectCoupon.coupon.orderTotal + '元才能使用',
        icon:'none',
        mask:true
      })
      return
    }
    userCoupon = userCoupon.map(item => {
      if(selected) {
        item.selected = false
      }
      if(item._id === id){
        item.selected = selected
      }
      return item
    })
    let actualPayment = 0,couponMoney = 0
    if(selected){
      actualPayment = this.data.orderTotal - selectCoupon.coupon.money
      couponMoney = selectCoupon.coupon.money
      userSelectCouponId = selectCoupon._id
    }else{
      actualPayment = this.data.orderTotal
      userSelectCouponId = ''
    }
    this.setData({
      userCoupon,
      actualPayment,
      couponMoney
    })
  },
  async submitOrder(){
    console.log('userSelectCouponId',userSelectCouponId)
    if(isEmptyObject(this.data.address)){
      wx.showToast({
        title: '请选择地址',
        icon:'none'
      })
      return
    }
    if(this.data.cart.length === 0){
      wx.showToast({
        title: '请选择商品',
        icon:'none'
      })
      return
    }
    console.log(this.data.cart)
    const goods = this.data.cart.map(item => {
      return {
        goodsId:item.goodsId,
        buyNumber:item.buyNumber
      }
    })
    wx.showLoading({
      title: '提交中',
      mask:true
    })
    const res = await Order.add({
      addressId:this.data.address._id,
      goods,
      userCouponId:this.data.userSelectCouponId
    })
    wx.hideLoading()
    if(res.success === 1){
      //调起支付处理
      // wx.requestPayment({
      //   nonceStr: '',
      //   package: '',
      //   paySign: '',
      //   timeStamp: '',
      // })
      wx.switchTab({
        url:'/pages/order/order',
      })
    }else{
      wx.showToast({
        title: res.message,
        icon:'none'
      })
    }
  },
  async onHide(){
    if(quickBuy == 1){
      await cartModel.removeQuickGoods()
    }
  },
  async onUnload(){
    if(quickBuy == 1){
      await cartModel.removeQuickGoods()
    }
  }
})