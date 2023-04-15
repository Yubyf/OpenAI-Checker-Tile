const axios = require("axios");
const {
    HttpProxyAgent,
    HttpsProxyAgent
} = require('hpagent')

const httpAgent = new HttpProxyAgent({
    proxy: 'http://127.0.0.1:1080'
})
const httpsAgent = new HttpsProxyAgent({
    proxy: 'http://127.0.0.1:1080'
})

const instance = axios.create({
    httpAgent,
    httpsAgent
});

class HttpClient {

    head(option, callback) {
        const config = {
            method: 'head',
            url: option.url,
            headers: option.headers,
        };
        instance.request(config)
            .then(response => {
                let data = response.data;
                if (typeof data === 'object') {
                    data = JSON.stringify(data);
                }
                callback(null, response, data);
            })
            .catch(error => {
                let data = error.response.data;
                if (typeof data === 'object') {
                    data = JSON.stringify(data);
                }
                callback(error, error.response, data);
            });
    }

    get(option, callback) {
        const config = {
            method: 'get',
            url: option.url,
            headers: option.headers,
        };
        instance.request(config)
            .then(response => {
                let data = response.data;
                if (typeof data === 'object') {
                    data = JSON.stringify(data);
                }
                callback(null, response, data);
            })
            .catch(error => {
                let data = error.response.data;
                if (typeof data === 'object') {
                    data = JSON.stringify(data);
                }
                callback(error, error.response, data);
            });
    }
}

module.exports = HttpClient;