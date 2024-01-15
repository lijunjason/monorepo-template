/**
 * @description 判断的是否是JSON字符串
 * @param isJSON
 * @returns
 */
export const isJSON = (str: string) => {
  if (typeof str == 'string') {
    try {
      const obj = JSON.parse(str);
      // 等于这个条件说明就是JSON字符串 会返回true
      if (typeof obj == 'object' && obj) {
        return true;
      } else {
        //不是就返回false
        return false;
      }
    } catch (e) {
      return false;
    }
  }
  return false;
};

/**
 * @description 检查是否支持WebRTC
 * @returns {boolean} 返回布尔值，表示是否支持WebRTC
 */
export function isWebRTCSupported(): boolean {
  if (!navigator.mediaDevices || !window.RTCPeerConnection) {
    return false;
  }

  // 检查 getUserMedia 方法
  if (!navigator.mediaDevices.getUserMedia) {
    return false;
  }

  // 检查 enumerateDevices 方法
  if (!navigator.mediaDevices.enumerateDevices) {
    return false;
  }

  return true;
}

/**
 * @method appendQueryParam
 * @description 给url添加参数
 * @returns
 */
export function appendQueryParam(
  url: string,
  paramKey: string,
  paramValue: string
) {
  const separator = url.includes('?') ? '&' : '?';
  const queryParams = `${paramKey}=${encodeURIComponent(paramValue)}`;
  return `${url}${separator}${queryParams}`;
}

class PubSub {
  subscribers: any = {};
  constructor() {
    this.subscribers = {};
  }

  subscribe(event: any, callback: any) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    this.subscribers[event].push(callback);
  }

  publish(event: any, data: any) {
    if (this.subscribers[event]) {
      this.subscribers[event].forEach((callback: any) => callback(data));
    }
  }
}
export const pubsub = new PubSub();
