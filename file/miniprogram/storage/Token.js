import {Storage} from '../utils/Storage.js'
import {getConfig} from '../utils/function.js'
const tokenKey = getConfig('storage.token') || 'token'
class Token extends Storage{
  constructor(){
    super(tokenKey,true)
  }
}
export {
  Token
}