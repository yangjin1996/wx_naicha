import {Storage} from '../utils/Storage.js'
import {getConfig} from '../utils/function.js'
const bannerKey = getConfig('storage.banner') || 'banner'
class Banner extends Storage{
  constructor(){
    super(bannerKey,true)
  }
}
export {
  Banner
}