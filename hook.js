var http = require('http')
var createHandler = require('gitlab-webhook-handler')
var handler = createHandler({ path: '/webhook' })
var cmd = require('node-cmd');
var fs = require('fs')
function getQueryString(url,name) {
    var theRequest = new Object();
    if (url.indexOf("?") != -1) {
        var str = url.substr(1);
        strs = str.split("&");
        for(var i = 0; i < strs.length; i ++) {
            theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
        }
    }
    return theRequest;
}

http.createServer(function (req, res) {
    var mode = getQueryString(req.url,'mode')['webhook?mode'];
    if(mode!='node'&&mode!='java'){
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end('{"code":1,"msg":"mode参数只能为java或者node."}')
        return;
    }
    fs.readFile('./password.txt', 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        if(data==req.headers['x-gitlab-token']){
            req.headers['mode'] = mode;
            handler(req, res, function (err) {
                res.statusCode = 404
                res.end('没有这个地扯')
            })
        }else{
            res.writeHead(200, { 'content-type': 'application/json' })
            res.end('{"code":1,"msg":"密码错误."}')
        }
    })

}).listen(7777);

console.log("Gitlab Hook Server running at http://0.0.0.0:7777/webhook");

handler.on('error', function (err) {
    console.error('Error:', err.message)
})

handler.on('push', function (event) {
    cmd.get('/root/issp/docker/'+event.mode+'/run.sh',function (err,data,stderr) {
        console.log(data)
        if(stderr){
            console.log(stderr)
        }
    })
})

handler.on('issues', function (event) {
    // console.log('Received an issue event for %s action=%s: #%d %s',
    //     event.payload.repository.name,
    //     event.payload.action,
    //     event.payload.issue.number,
    //     event.payload.issue.title)
})