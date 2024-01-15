import {
  openFloatPhoneBar,
  getAppSysInfo,
  bizSendMsgToFloat,
} from '@/phone-bar/jsbridge';

import {
  isWebRTCSupported,
  appendQueryParam,
  pubsub,
  isJSON,
} from '@phone-bar/utils';

import {
  isDebugPhoneBar,
  CAN_CALL_EVENT,
  OPEN_SUC_FIRST_EVENT,
  ERROR_CALLBACK_EVENT,
} from './config';

const store = {};
/**
 * @method initPhoneBar
 * @description 初始化电话条
 * @returns
 */
export function initPhoneBar() {
  const preCheckWebRTCSupported = isWebRTCSupported();
  console.log(`%c isWebRTCSupported=${preCheckWebRTCSupported}`, 'color: red');
  window._floatMsgCallBackData = {}; // 回调sdk透传数据
  window._isInitWebrtc = false; // 是否初始化webrtc
  window._showPhoneBar = false; // 是否已经显示电话条
  window._canPhoneCall = false; // 是否可拨打电话
  window._isCalling = false; // 是否正在拨打电话
  // 注册电话条回调成功事件
  window.floatMsgCallBack = (data) => {
    if (isJSON(data)) {
      data = JSON.parse(data);
    }
    console.log(
      `%c b-floatMsgCallBack=${JSON.stringify(data)}`,
      'color: green'
    );
    window._floatMsgCallBackData = data;

    // 当前是否可拨打电话
    if (data?.canPhoneCall) {
      window._canPhoneCall = true;
      pubsub.publish(CAN_CALL_EVENT, data);
    } else {
      pubsub.publish(ERROR_CALLBACK_EVENT, data);
      window._canPhoneCall = false;
    }
    // 是否为通话中
    if (data?.isCalling) {
      window._isCalling = true;
    } else {
      window._isCalling = false;
    }
    // 电话条首次打开成功
    if (!window._showPhoneBar && data?.phoneBarStatus === 'open') {
      window._showPhoneBar = true;
      pubsub.publish(OPEN_SUC_FIRST_EVENT, data);
    }
    // 电话条关闭
    if (data?.phoneBarStatus === 'close') {
      window._isInitWebrtc = false;
      window._showPhoneBar = false;
      window._canPhoneCall = false;
    }
    // callId处理
    if (data?.data?.callId) {
      console.log(
        `%c callId=${JSON.stringify(data.data.callId)}`,
        'color: red'
      );
      store.commit('setCurCallId', data.data.callId);
    }
  };

  // 注册电话条错误消息日志事件
  window.errorMsgCallBack = (data) => {
    if (isJSON(data)) {
      data = JSON.parse(data);
    }
    console.log(`%c b-errorMsgCallBack=${JSON.stringify(data)}`, 'color: red');
  };
}

/**
 * @method initWebrtc
 * @description 初始化webrtc
 * @param maxDelay 电话条开发最大超时时间 10s
 * @returns
 */
export function initWebrtc() {
  return new Promise((resolve) => {
    if (
      !window.floatMsgCallBack ||
      typeof window.floatMsgCallBack !== 'function'
    ) {
      return resolve({ status: 'f', msg: '电话条未初始化' });
    }
    // 如果为可拨打电话状态直接返回
    if (window._canPhoneCall) {
      return resolve({ status: 's', data: window._floatMsgCallBackData });
    }
    // 订阅当前是都可拨打电话
    pubsub.subscribe(CAN_CALL_EVENT, function (data) {
      return resolve({ status: 's', data: data });
    });
    // 订阅除电话条错误消息日志事件
    pubsub.subscribe(ERROR_CALLBACK_EVENT, function () {
      return resolve({ status: 'f' });
    });
    if (!window._isInitWebrtc) {
      console.log(`%c init初始化电话条`, 'color: green');
      bizSendMsgToFloat({
        methodName: 'init',
      });
      window._isInitWebrtc = true;
    } else {
      if (window._isCalling) {
        return resolve({ status: 'f', msg: '正在呼叫请不要重复外呼' });
      }
      console.log(`%c reload刷新电话条`, 'color: green');
      bizSendMsgToFloat({
        methodName: 'reload',
      });
    }
  });
}

/**
 * @method openPhoneBar
 * @description 打开电话条
 * @param url 打开电话条参数
 * @returns
 */
export function openPhoneBar(url) {
  console.log(`%c b-openPhoneBarUrl=${url}`, 'color: green');
  return new Promise(async (resolve) => {
    if (!isWebRTCSupported()) {
      return resolve({
        status: 'f',
        code: '1001',
      });
    }

    if (
      !window.floatMsgCallBack ||
      typeof window.floatMsgCallBack !== 'function'
    ) {
      return resolve({ status: 'f', msg: '电话条未初始化' });
    }

    if (!url && !window._showPhoneBar) {
      return resolve({ status: 'f', msg: '初始化电话条url参数错误' });
    }

    if (window._showPhoneBar) {
      console.log(`%c 电话条已打开`, 'color: green');
      return resolve({ status: 's' });
    }

    pubsub.subscribe(OPEN_SUC_FIRST_EVENT, function () {
      console.log(`%c 电话条打开成功`, 'color: green');
      return resolve({ status: 's' });
    });

    try {
      const res = await getAppSysInfo();
      const baseSize = 750 / 148; // 设计稿宽度比例
      const screeeWidth = String(res.screenSize).split('*')?.[0];
      const clientWidth = document.documentElement.clientWidth;
      const clientHeight = document.documentElement.clientHeight;
      const floatWidth = screeeWidth / baseSize;
      console.log(`%c 美事版本=${res.build}`, 'color: red');
      if (+res.build < 2024010100) {
        return resolve({ status: 'f', msg: '美事版本过低，请更新到最新版本' });
      }

      console.log(`%c begin-打开电话条`, 'color: green');
      if (isDebugPhoneBar) {
        await openFloatPhoneBar({
          url: appendQueryParam(url, 'width', clientWidth),
          floatWidth: clientWidth,
          floatHeight: clientHeight,
        });
      } else {
        await openFloatPhoneBar({
          url: appendQueryParam(url, 'width', clientWidth),
          floatWidth: floatWidth,
        });
      }
      console.log(`%c end-打开电话条`, 'color: green');
    } catch (error) {
      window._showPhoneBar = false;
      resolve({ status: 'f', msg: '打开电话条失败' });
    }
  });
}

/**
 * @method beforeWebrtcPhoneCall
 * @description 打开电话条并初始化webrtc
 * @param url 打开电话条参数
 * @param maxDelay 最大超时时间 10s
 * @returns
 */
export function beforeWebrtcPhoneCall(url) {
  return new Promise(async (resolve) => {
    store.commit('setCurCallId', '');
    const phoneBarRes = await openPhoneBar(url);
    if (phoneBarRes.status === 'f') return resolve(phoneBarRes);
    console.log(`%c 电话条已就绪`, 'color: green');
    const webrtcRes = await initWebrtc();
    if (webrtcRes.status === 'f') return resolve(webrtcRes);
    resolve(webrtcRes);
  });
}
