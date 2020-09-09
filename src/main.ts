import md5 from "md5"; // md5签名算法
import {appId, appSecret} from "./private";
import * as querystring from "querystring";
import * as https from "https"; //node https模块

type ErrorMap = { // 申明错误类型
    [key: string]: string
}

const errorMap: ErrorMap = {
    52003: '用户认证失败',
    52001: '签名错误',
    52004: '账户余额不足',
}


export const translate = (word: string) => {
    const salt = Math.random()
    const sign = md5(appId + word + salt + appSecret)
    let from, to

    if (/[a-zA-Z]/.test(word[0])) {
        from = 'en'
        to = 'zh'
    } else {
        from = 'zh'
        to = 'en'
    }

    const query: string = querystring.stringify({
        q: word, appid: appId, salt, sign, from, to,
    })
    const options = {
        hostname:'api.fanyi.baidu.com',
        port: 443,
        path: '/api/trans/vip/translate?' + query,
        method: 'GET'
    }

    const request = https.request(options, response => {
        // Buffer(缓冲区) 处理像TCP流或文件流时，必须使用到二进制数据。因此node.js中Buffer类用来专门存放二进制数据的缓存区
        let chunks: Buffer[] = []
        response.on('data', chunk => {
            chunks.push(chunk)
        })
        response.on('end', ()=> {
            const string = Buffer.concat(chunks).toString()
            type BaiduResult = {
                error_code?: string;
                error_msg?: string;
                from: string;
                to: string;
                trans_result: {src: string; dst: string}[]
            }
            const object: BaiduResult = JSON.parse(string)
            if (object.error_code) {
                console.error(errorMap[object.error_code] || object.error_msg)
                process.exit(2) // 因错误而结束进程
            } else {
                object.trans_result.map(object => {
                    console.log(object.dst);
                })
                process.exit(0) // 因正确而结束进程
            }
        })
    })

    request.on('error', err => {
        console.error(err)
    })
    request.end()
}
