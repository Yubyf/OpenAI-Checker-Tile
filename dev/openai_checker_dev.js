const HttpClient = require('./statsh_http_dev.js');
const $httpClient = new HttpClient();
const $done = (panel) => {
    console.log(panel);
}

/**
 * @description: Check if the current IP supported by OpenAI for Stash 2.0.
 * @author: Yubyf
 *
 * Reference: https://github.com/missuo/OpenAI-Checker
 */
const MAIN_OPENAI_URL = 'https://chat.openai.com';
const TRACE_PATH = '/cdn-cgi/trace';
const GEOIP_URL = 'https://api.ip.sb/geoip/'

const REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36',
}

const SUPPORT_COUNTRY = ["AL", "DZ", "AD", "AO", "AG", "AR", "AM", "AU", "AT", "AZ", "BS", "BD", "BB", "BE", "BZ", "BJ", "BT", "BO", "BA", "BW", "BR", "BN", "BG", "BF", "CV", "CA", "CL", "CO", "KM", "CG", "CR", "CI", "HR", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "SV", "EE", "FJ", "FI", "FR", "GA", "GM", "GE", "DE", "GH", "GR", "GD", "GT", "GN", "GW", "GY", "HT", "VA", "HN", "HU", "IS", "IN", "ID", "IQ", "IE", "IL", "IT", "JM", "JP", "JO", "KZ", "KE", "KI", "KW", "KG", "LV", "LB", "LS", "LR", "LI", "LT", "LU", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MR", "MU", "MX", "FM", "MD", "MC", "MN", "ME", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NZ", "NI", "NE", "NG", "MK", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PL", "PT", "QA", "RO", "RW", "KN", "LC", "VC", "WS", "SM", "ST", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB", "ZA", "KR", "ES", "LK", "SR", "SE", "CH", "TW", "TZ", "TH", "TL", "TG", "TO", "TT", "TN", "TR", "TV", "UG", "UA", "AE", "GB", "US", "UY", "VU", "ZM"];

(async () => {
    console.log('------------');
    console.log('Start checking');

    let title = 'OpenAI Checker';
    let content = 'Check failed, try again later';

    try {
        let [{
            success,
            message
        }] = await Promise.all([checkMainUrl()]);
        if (success) {
            let [{ support, ipAddress, location, organization }] = await Promise.all([checkTrace()])
            const flagEmoji = countryCodeToEmoji(location);
            if (support) {
                title = `OpenAI is AVALIABLE`;
            } else {
                title = `OpenAI is NOT AVALIABLE`;
            }
            content = `IP: ${ipAddress} - ${flagEmoji}${location}\nOrganization: ${organization}`
        } else {
            content = message;
        }
    } catch (error) {
        content = 'Check failed, try again later';
    }
    console.log(`Display panel content - ${content}`)
    panel = {
        title: title,
        content: content,
        icon: "https://raw.githubusercontent.com/Yubyf/OpenAI-Checker-Tile/master/res/logo.png",
        backgroundColor: '#4AA081',
    }
    $done(panel);
})();

async function checkMainUrl() {
    console.log('Start main url checking')
    return new Promise((resolve) => {
        let option = {
            url: MAIN_OPENAI_URL,
            headers: REQUEST_HEADERS,
        }
        $httpClient.get(option, function (error, response, data) {
            var deniedClassMatch = data.search('<div class="cf-error.*');
            var deniedStringMatch = data.search('Access denied');
            if (deniedClassMatch !== -1 || deniedStringMatch !== -1) {
                console.log('Main url check failed')
                resolve({
                    success: false,
                    message: 'Your IP is BLOCKED!'
                })
            } else {
                console.log('Main url check success')
                resolve({
                    success: true,
                    message: ''
                });
            }
        })
    })
}

async function checkTrace() {
    console.log('Start trace checking')
    let innerCheck = () => {
        return new Promise((resolve, reject) => {
            let option = {
                url: MAIN_OPENAI_URL + TRACE_PATH,
                headers: REQUEST_HEADERS,
            }
            $httpClient.get(option, function (error, response, data) {
                if (response.status !== 200) {
                    console.log('Trace check failed')
                    reject(null)
                    return
                }
                const ipRegex = /ip=(.+?)\n/;
                const ipMatches = data.match(ipRegex);
                const ipAddress = ipMatches[1];
                const locRegex = /loc=(.+?)\n/;
                const locMatches = data.match(locRegex);
                const location = locMatches[1];
                resolve({
                    ipAddress: ipAddress,
                    location: location
                })
            })
        })
    }

    let traceResult = null
    await innerCheck()
        .then(async (result) => {
            if (result) {
                let isSupport = SUPPORT_COUNTRY.includes(result.location);
                await checkGeoIp(result.ipAddress).then((organization) => {
                    traceResult = {
                        support: isSupport,
                        ipAddress: result.ipAddress,
                        location: result.location,
                        organization: organization
                    };
                }).catch(() => {
                    traceResult = {
                        support: isSupport,
                        ipAddress: result.ipAddress,
                        location: result.location,
                        organization: 'Unknown'
                    };
                })
            }
        })
    return traceResult;
}

async function checkGeoIp(ipAddress) {
    return new Promise((resolve, reject) => {
        let option = {
            url: GEOIP_URL + ipAddress,
            headers: REQUEST_HEADERS,
        }
        $httpClient.get(option, function (error, response, data) {
            console.log(`GeoIp check status - ${response.status} - ${ipAddress} - ${data}`)
            if (response.status !== 200) {
                console.log(`GeoIp check failed - ${error}`)
                reject(null)
                return
            }
            let organization = JSON.parse(data)?.organization;
            resolve(organization);
        })
    })
}

function countryCodeToEmoji(countryCode) {
    const OFFSET = 127397;
    const codePoints = [...countryCode.toUpperCase()].map((char) => char.codePointAt() + OFFSET);
    return String.fromCodePoint(...codePoints);
}
