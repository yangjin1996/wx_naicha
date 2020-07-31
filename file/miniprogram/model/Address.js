import {
  isObject,
  isEmptyObject,
  getConfig
} from '../utils/function.js'
const ADDRESS_STORE_NAME = getConfig('storage.selectAddress')
class Address {
  static async getAddress () {
    return await wx.cloud.callFunction({
      name:'address',
      data:{
        $url:'list'
      }
    }).then(res => res.result)
  }
  static async add (address) {
    if (!isObject(address) || isEmptyObject(address)){
      return {success:0,message:'错误'}
    }
    //检测姓名电话号码等不能为空
    const res = await wx.cloud.callFunction({
      name:'address',
      data:{
        $url:'add',
        address
      }
    }).then(res => res.result)
    return res
  }

  static async update(address,id){
    if (!isObject(address) || isEmptyObject(address) || !id){
      return {success:0,message:'错误'}
    }
    const res = await wx.cloud.callFunction({
      name:'address',
      data:{
        $url:'update',
        address,
        id
      }
    }).then(res => res.result)
    return res
  }

  static async getDefaultOrSelectAddress () {
    const storageAddress = wx.getStorageSync(ADDRESS_STORE_NAME)
    if(storageAddress){
      return storageAddress
    }
    try{
      return await wx.cloud.callFunction({
        name:'address',
        data:{
          $url:'default'
        }
      }).then(res => res.result)
    }catch(err){
      return {}
    }
  }

  static async getAddressById(id){
    try{
      const res = await wx.cloud.callFunction({
        name:'address',
        data:{
          $url:'row',
          id
        }
      }).then(res => res.result)
      if(res.success !== 1){
        return {}
      }else{
        return res.data
      }
    }catch(err){
      return {}
    }
  }

  static async deleteAddress (id) {
    if(!id){
      return {success:0,message:'参数错误'}
    }
    try{
      return await wx.cloud.callFunction({
        name:'address',
        data:{
          $url:'delete',
          id
        }
      }).then(res => res.result)
    }catch(err){
      return {success:0,message:'参数错误'}
    }
  }
}

export {
  Address
}