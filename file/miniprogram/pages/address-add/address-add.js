import {Address} from '../../model/Address.js'
import {getConfig,isEmptyObject} from '../../utils/function.js'
const ADDRESS_STORE_NAME = getConfig('storage.selectAddress')
let redirectType = ''
let addressId = ''
Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    region: [],
    customItem: '全部',
    address:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    redirectType = options.from || ''
    addressId = options.id || ''
    this.getAddress()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },
  getAddress(){
    if(!addressId){
      return
    }
    Address.getAddressById(addressId).then(res => {
      
      if(!isEmptyObject(res)){
        this.setData({
          address:res,
          region:res.region
        })
      }
    })
  },
  bindRegionChange: function (e) {
    this.setData({
      region: e.detail.value
    })
  },
  async saveAddress(e){
    const data = e.detail.value
    data.region = this.data.region
    wx.showLoading({
      title: '正在提交数据',
      mask: true
    })
    let res
    if(addressId != ''){
      res = await Address.update(data,addressId)
    } else {
      res = await Address.add(data)
    }
    wx.hideLoading()
    if(res.success == 1){
      wx.showToast({
        title: addressId != '' ? '修改成功' : '添加成功',
      })
      if(redirectType === 'list' && addressId === ''){
        data._id = res.addressId
        wx.setStorageSync(ADDRESS_STORE_NAME,data)
        wx.switchTab({
          url:'/pages/list/list',
        })
      }else{
        wx.redirectTo({
          url:'/pages/address/address?from=' + redirectType
        })
      }
    }else{
      wx.showToast({
        title: res.message,
        icon:'none'
      })
    }
  }
})