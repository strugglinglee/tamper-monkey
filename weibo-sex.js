// ==UserScript==
// @name         AjaxHook
// @namespace    http://tmpermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       you
// @match        https://weibo.com/*
// @run-at       document-start
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.6.0/jquery.min.js
// ==/UserScript==
class XMLHttp {
  request = function (param) {};
  response = function (param) {};
}
let http = new XMLHttp();
const genderMap = {};

// 初始化 拦截XMLHttpRequest
function initXMLHttpRequest() {
  let open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (...args) {
    let send = this.send;
    let _this = this;
    let post_data = [];
    this.send = function (...data) {
      post_data = data;
      return send.apply(_this, data);
    };
    // 请求前拦截
    http.request(args);

    this.addEventListener(
      'readystatechange',
      function () {
        if (this.readyState === 4) {
          let config = {
            url: args[1],
            status: this.status,
            method: args[0],
            data: post_data,
          };
          // 请求后拦截
          http.response({ config, response: this.response });
        }
      },
      false
    );
    return open.apply(this, args);
  };
}

// 初始化页面
(function () {
  const mark = (jObj, gender) => {
    const isMale = gender === '男';
    jObj.append(
      `<span style="background-color: ${
        isMale ? 'red' : '#00d0ff'
      };color: #FFF;margin-left: 5px;font-weight: bold;border-radius: 8px;padding: 2px 5px;">${gender}</span>`
    );
  };

  // XMLHttpRequest 拦截
  http.request = function (param) {
    // console.log(param, "---request");
  };
  http.response = function (res) {
    // console.log(res, "---request");
    if (res.config.url.includes('/ajax/profile/followContent')) {
      const response = JSON.parse(res.response);
      const users = response?.data?.follows?.users;
      if (users && users.length) {
        users.forEach((u) => {
          if (!genderMap[u.id]) {
            const genderInfo = {
              m: '男',
              f: '女',
            };
            genderMap[u.id] = genderInfo[u.gender] || '未知';
          }
        });
      }
    }
  };

  // 初始化 XMLHttpRequest
  initXMLHttpRequest();

  const eachFn = (ele) => {
    const list = ele.find("a[class^='ALink_none']");
    list.each(async function () {
      const href = $(this).attr('href');
      const array = /\/u\/(\d+)/.exec(href);
      if (array != null) {
        const uid = array[1];
        const gender = genderMap[uid];
        mark($(this), gender);
      }
    });
  };

  setTimeout(() => {
    const currentEle = $("[id^='scroller']").find(
      "[class^='vue-recycle-scroller__item-wrapper']"
    );

    eachFn(currentEle);
    currentEle.bind('DOMNodeInserted', function (e) {
      const ele = $(e.target);
      eachFn(ele);
    });
  }, 1500);
})();
