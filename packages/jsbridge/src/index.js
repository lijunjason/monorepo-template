// 美事jsbridge 交互文档
// 最新地址  http://wbook.58corp.com/books/meishi/
import { MSJSBridgeCall } from './utils.js';
/**
 * @description 美事app toast
 * @param {*} message
 * @returns {Promise<any>}
 */
export async function msAppToast(message) {
  return MSJSBridgeCall('system', 'toast', { message });
}
/**
 * @description 关闭浮动电话栏
 * @returns {Promise<any>}
 */
export async function closeFloatPhoneBar() {
  return MSJSBridgeCall('float', 'close');
}
/**
 * @description 打开浮动电话条
 * @returns {Promise<any>}
 */
export async function openFloatPhoneBar(data = {}) {
  return MSJSBridgeCall('float', 'open', data);
}

/**
 * @description 浮窗发送消息给业务方
 * @param {{}} [data={}]
 * @returns {Promise<any>}
 */
export async function floatSendMsgToBiz(
  data = {},
  methodName = 'floatMsgCallBack'
) {
  return MSJSBridgeCall('float', 'sendMsg', {
    from: 'float',
    to: 'business',
    method: methodName,
    data: JSON.stringify(data),
  });
}
/**
 * @description 给电话条发送消息
 * @returns {Promise<any>}
 */
export async function bizSendMsgToFloat(
  data = {},
  methodName = 'businessMsgCallBack'
) {
  return MSJSBridgeCall('float', 'sendMsg', {
    from: 'business',
    to: 'float',
    method: methodName,
    data: JSON.stringify(data),
  });
}
/**
 * @description 获取系统信息
 * @returns {Promise<any>}
 */
export async function getAppSysInfo() {
  return MSJSBridgeCall('system', 'info');
}
