var axios = require('axios');
var config = require('./config');
var sync_request = require('sync-request');

function decoder(data, encode) {
    var replace = ["&#39;", "'", "&quot;", '"', "&nbsp;", " ", "&gt;", ">", "&lt;", "<", "&amp;", "&", "&amp;", "&", "&yen;", "¥"];
    if (encode) {
        replace.reverse();
    }
    for (var i = 0, str = data; i < replace.length; i += 2) {
        str = str.replace(new RegExp(replace[i], 'g'), replace[i + 1]);
    }
    return str;
}

module.exports = {
    summary: "抓取微信公众号历史记录",
    * beforeSendResponse(requestDetail, responseDetail) {
        if (/mp\/profile_ext\?action=home/i.test(requestDetail.url)) {//当链接地址为公众号历史消息页面
            console.log('[INFO] find url->html')
            try {
                var reg = /var msgList = (\"|\')(.*?)(\"|\');/i;//定义历史消息正则匹配规则（和第一种页面形式的正则不同）
                var ret = decoder(reg.exec(responseDetail.response.body.toString())[2], false);//转换变量为string
                var __biz = /__biz=(.*?)&/i.exec(requestDetail.url)[1];
                var next_offset = /var next_offset = (\"|\')(.*?)(\"|\')/i.exec(responseDetail.response.body.toString())[2];
                var can_msg_continue = /var can_msg_continue = (\"|\')(.*)(\"|\')/i.exec(responseDetail.response.body.toString())[2];
                var nickname = /var nickname = (\"|\')(.*?)(\"|\')/i.exec(responseDetail.response.body.toString())[2];
                var appmsg_token = /window.appmsg_token = (\"|\')(.*)(\"|\')/i.exec(responseDetail.response.body.toString())[2];
                console.log('[INFO]data->' + ret);
                // 提交json
                // ret是个list,使用ret[1]
                axios.post(config.api_url + '/api/post', {
                    type: 1,
                    data: ret,
                    __biz: __biz,
                    next_offset: next_offset,
                    can_msg_continue: can_msg_continue,
                    appmsg_token: appmsg_token,
                    nickname: nickname
                }, {
                    timeout: 0
                }).then().catch(err => {
                    console.log('Error', err.message);
                });
                var h = sync_request('GET', config.api_url + '/api/html').getBody().toString();
                // console.log('[h]->' + h);
                const newResponse = responseDetail.response;
                newResponse.body = h + newResponse.body;
                // console.log('[body]->' + newResponse.body);
                return new Promise((resolve, reject) => {
                    resolve({response: newResponse});
                });
            } catch (e) {
                // 错误log
                console.log('[ERROR]' + e.toString())
                return null;
            }
        } else if (/mp\/profile_ext\?action=getmsg/i.test(requestDetail.url)) {//上滑加载的内容
            console.log('[INFO] find url->json')
            try {
                // 提交json
                var json = JSON.parse(responseDetail.response.body.toString());
                if (json.general_msg_list != []) {
                    console.log('[INFO]data->' + json.general_msg_list);
                    __biz = /__biz=(.*?)&/i.exec(requestDetail.url)[1];
                    appmsg_token = /appmsg_token=(.*?)&/i.exec(requestDetail.url)[1];
                    axios.post(config.api_url + '/api/post', {
                        // TODO
                        type: 1,
                        data: json.general_msg_list,
                        __biz: __biz,
                        next_offset: json.next_offset,
                        can_msg_continue: json.can_msg_continue,
                        appmsg_token: appmsg_token
                    }, {
                        timeout: 0
                    });
                }
            } catch (e) {
                // 错误log
                console.log('[ERROR]' + e.toString())
                return null;
            }
        } else {
            return null
        }
    }
};