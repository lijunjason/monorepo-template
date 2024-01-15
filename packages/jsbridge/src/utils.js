const errorObj = {
  errorCode: 'insertError',
  errorMsg: '美事交互异常，请重试',
};

// const errorStr = JSON.stringify(errorObj);

export const insertFn = function () {
  return new Promise((resolve) => {
    let num = 0;
    // 防止被重复调用多次 其他没有返回
    const initTimers = setInterval(() => {
      num++;
      if (window.MSJSBridge) {
        clearInterval(initTimers);
        resolve(true);
      }
      if (num > 10) {
        clearInterval(initTimers);
        // 美事不同的接口返回的状态不一致 执行reject无法后续统一
        resolve(errorObj);
      }
    }, 500);
  });
};
var timeOut = 300;
export const MSJSBridge = (target, action, data = {}, resolve) => {
  // hash 模式第一次要延时
  setTimeout(() => {
    timeOut = 0;
    window.MSJSBridge.Call({
      target: target,
      action: action,
      data: data,
      callback: {
        success: function (result) {
          // 错误 {"callId":""dd""}
          // 正确 {"callId":"dd"}
          var obj;
          try {
            obj = JSON.parse(result);
          } catch (e) {
            try {
              result = result.split('');
              result[10] = '';
              result[result.length - 2] = '';
              result = result.join('');
              obj = JSON.parse(result);
            } catch (e) {
              sendError(target, action, result);
              obj = {
                errorCode: 'errorCode',
                errorMsg: '美事交互解析异常，请联系开发',
                result: result,
              };
            }
          }
          resolve(obj);
        },
        fail: function (result) {
          sendError(target, action, result);
          var obj;
          try {
            obj = JSON.parse(result);
            // 手动区分fail 和success 没有状态区分
            obj = Object.assign({}, { errorCode: 'errorCode' }, obj);
          } catch (e) {
            obj = {
              errorCode: 'errorCode',
              result: result,
            };
          }
          resolve(obj);
        },
      },
    });
  }, timeOut);
};
export const MSJSBridgeCall = (target, action, data = {}) => {
  return new Promise((resolve) => {
    const insertExample = insertFn();
    return insertExample
      .then((res) => {
        if (res !== true) {
          // 注入失败
          resolve(res);
        } else {
          return MSJSBridge(target, action, data, resolve);
        }
      })
      .then((res) => {
        return JSON.parse(res);
      })
      .catch((err) => {
        // 捕获之前程序的错误 抛出
        const obj = Object.assign({}, { errorMsg: err });
        return obj;
      });
  });
};
function sendError(target, action, data) {
  console.log('sendError', target, action, data);
}
