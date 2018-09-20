const http = require('http')
const qs = require('querystring');

const hostname = 'localhost'

const port = 3000

let server = http.createServer(function(req, res) {
    let body = '';  // 一定要初始化为"" 不然是undefined
    req.on('data', function(data) {
        body += data; // 所接受的Json数据
    });
    req.on('end', function() { 
        res.writeHead(200, {  // 响应状态
            "Content-Type": "text/plain",  // 响应数据类型
            'Access-Control-Allow-Origin': '*'  // 允许任何一个域名访问
        });
        if(qs.parse(body).name == 'food') {
            res.write('apple');
        } else {
            res.write('other');
        } 
        res.end();
    });   
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`)
})