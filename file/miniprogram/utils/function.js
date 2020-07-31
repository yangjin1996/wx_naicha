function dateFormat(fmt,date){
  let ret;
  const opt ={
      "Y+":date.getFullYear().toString(),
      "m+":(date.getMonth() + 1).toString(),
      "d+":date.getDate().toString(),
      "H+":date.getHours().toString(),
      "M+":date.getMinutes().toString(),
      "S+":date.getSeconds().toString()
  };
  for(let k in opt){
      ret = new RegExp("("+ k + ")").exec(fmt);
      if(ret){
          fmt = fmt.replace(ret[1],(ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length,"0")))
      };
  };
  return fmt;
}

const getConfig = function (name){
  const distIndex = name.indexOf('.')
  let fileName = '',configName = ''
  if(distIndex > -1){
    fileName = name.slice(0,distIndex)
    configName = name.substr(distIndex+1)
  }else{
    fileName = name
  }
  try{
    const config = require('../config/' + fileName).default
    if(config){
      return configName !== '' ? config[configName] : config
    }else{
      return null
    }
  } catch (err){
    console.log('配置文件function错误' + err)
    return null
  }
}

const isObject = function (obj) {
  return typeof (obj) == 'object' && obj != null
}
const isEmptyObject = function (obj) {
  if(!isObject(obj)){
    return !obj
  }
  return Object.keys(obj).length === 0
}

export {
  getConfig,
  isObject,
  isEmptyObject,
  dateFormat
}