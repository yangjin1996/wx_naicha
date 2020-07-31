import {Cart} from '../../model/Cart.js'
import {Address} from '../../model/Address.js'
import {getConfig, isEmptyObject} from '../../utils/function.js'
const AUTH_LOGIN_KEY = getConfig('app.auth_login_key')
const ADDRESS_STORE_NAME = getConfig('storage.selectAddress')
const cartModel = new Cart()
const FETCH_NUM = 6
let catId = -1
let promotion = [
  {cat_id:-1,cat_name:'热销'},
  {cat_id:-2,cat_name:'优惠'}
]
Page({

  /**
   * 页面的初始数据
   */
  data: {
    address:{},
    category:[],
    goods:[],
    bodyHeight:0,
    rightTitle:'',
    hasMore:true,
    cart:[]
  },
  async getCategory(){
    let category = await wx.cloud.callFunction({
      name:'goods',
      data:{
        $url:'category'
      }
    }).then(res => res.result)
    category = promotion.concat(category)
    this.setData({
      category
    })
  },
  async getGoodsList(){
    if(!this.data.hasMore){
      wx.showToast({
        title:'亲，已经到底了~',
        icon:'none'
      })
      return
    }
    const data = {
      $url:'list',
      number:FETCH_NUM,
      offset:this.data.goods.length
    }
    if(catId === -1){
      data.isRecommend = 1
    }else if(catId === -2){
      data.isSales = 1
    }else if(catId > 0){
      data.pid = catId
    }
    wx.showLoading({
      title: '加载中',
      mask:true
    })
    const list = await wx.cloud.callFunction({
      name:'goods',
      data
    }).then(res => res.result)
    wx.hideLoading()
    if(list.length > 0){
      let goods = this.data.goods.concat(list)
      this.setData({
        goods
      })
      this.reformGoods()
    }else{
      wx.showToast({
        title:'亲，已经到底了~',
        icon:'none'
      })
      this.setData({
        hasMore:false
      })
    }
  },
  async reformGoods(){
    const cart = await cartModel.getCart()
    const goods = this.data.goods.map(item => {
      item.buyNumber = 0
      //根据购物车的数据处理buyNumber
      const tmp = cart.filter(val => val.goodsId === item.goods_id)
      if(tmp.length > 0){
        item.buyNumber = tmp[0].buyNumber
      }
      return item
    })
    this.setData({
      goods,
      cart
    })
  },
  loadMore(){
    this.getGoodsList()
  },
  async editCart(e){
    wx.showLoading({
      title: '操作中',
      mask:true
    })
    const goodsId = e.detail.goodsId
    const type = e.detail.type
    if(type === 1){
      await this.addCart(goodsId)
    }else{
      await this.reduceCart(goodsId)
    }
    wx.hideLoading()
  },
  async addCart(goodsId){
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
    let res = null
    if(cart.length === 0){
      const data = {
        goodsId:goods.goods_id,
        goodsName:goods.goods_name,
        goodsImg:goods.goods_img,
        goodsPrice:goods.goods_price,
        buyNumber:1
      }
      res = await cartModel.setCart(data)
    }else{
      const buyNumber = cart[0].buyNumber + 1
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
  changeCategory(e){
    catId = e.detail.catId
    const index = this.data.category.findIndex(item => item.cat_id === catId)
    const rightTitle = this.data.category[index].cat_name || ''
    this.setData({
      rightTitle,
      goods:[],
      hasMore:true
    })
    this.getGoodsList()
  },
  async initData(){
    await this.getAddress()
    await this.getCategory()
    await this.getGoodsList()
    const index = this.data.category.findIndex(item => item.cat_id === catId)
    const rightTitle = this.data.category[index].cat_name || ''
    this.setData({
      rightTitle
    })
    wx.getSystemInfo({
      success:res => {
        // console.log(res)
        const query = wx.createSelectorQuery()
        query.select('#address').boundingClientRect(rect => {
          this.setData({
            bodyHeight:res.windowHeight - rect.height
          })
        }).exec()
      }
    })
  },
  cartSubmit(){
    //判断是否选择地址
    if(isEmptyObject(this.data.address)){
      wx.showToast({
        title: '请选择地址',
        icon:'none'
      })
      return
    }
    //判断购物车是否为空
    if(this.data.cart.length === 0){
      wx.showToast({
        title: '请选择商品',
        icon:'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/settlement/settlement',
    })
  },
  async getAddress(){
    const address = await Address.getDefaultOrSelectAddress()
    this.setData({
      address
    })
    const storageAddress = wx.getStorageSync(ADDRESS_STORE_NAME)
    if(!storageAddress && !isEmptyObject(address)){
      wx.setStorageSync(ADDRESS_STORE_NAME, address)
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const isLogin = wx.getStorageSync(AUTH_LOGIN_KEY)
    if(isLogin != 1){
      wx.switchTab({
        url:'/pages/home/home'
      })
      return
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.initData()
  },
  resetData(){
    this.setData({
      address:{},
      category:[],
      goods:[],
      hasMore:true,
      cart:[]
    })
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: async function () {
    this.resetData()
    await this.initData()
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})