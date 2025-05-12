/**
 * Copyright: ThoughtSpot Inc. 2025
 * Author: Priyanshu Kumar(priyanshu.kumar@thoughtspot.com)
 *
 */
let windowObj = window;

console.log("CustomVariablesFor3rdPartyTools", window.tsEmbed);
let infoResponse;
let pendoKey = windowObj.tsEmbed.pendoKey; // replace this in actual demo
let thoughtspotHost = windowObj.tsEmbed.hostName;
let LOADED_SCRIPTS_NUMBER = 0;

function getPendoVisitorConfig() {
    const config = {
        id: `${infoResponse?.userGUID}|${infoResponse?.configInfo?.experimentation?.growth?.clusterId}`,
    };
    console.log("visitor config", config);
    return config;
}

function getPendoAccountConfig() {
    const config = {
        id: infoResponse?.configInfo?.experimentation?.growth?.clusterId,
        name: infoResponse?.configInfo?.experimentation?.growth?.clusterName,
    };
    console.log("account config", config);
    return config;
}

async function initializePendo() {
    await windowObj.pendo.initialize({
        apiKey: pendoKey,
        visitor: getPendoVisitorConfig(),
        account: getPendoAccountConfig(),
    });
    console.log("Pendo is initialized !!")
}

/**
 * The function is triggered whenever a script onLoad is complete
 */
function shouldTriggerInitializePendo() {
    LOADED_SCRIPTS_NUMBER += 1;

    if (LOADED_SCRIPTS_NUMBER === 4) {
        initializePendo();
    }
}

function onPendoLoadError(err) {
    console.warn('Unable to load Pendo', err);
}

/*
 * Inserts some <script> elements onto the page, to load Pendo. The reason some
 * of the code appears minimized/obfuscated is because Pendo gave us this code
 * already in that state, and informed us to use it as-is. It is okay to amend
 * this code with non-minimized code if desired, however.
 */
async function insertPendoScript() {
    // defer pendo script addition by 3 seconds
    return setTimeout(() => {
        let w;
        let x;
        let y;
        let z;
        let didReportPendoError = false;

        const o = (windowObj.pendo = windowObj.pendo || {});
        o.q = [];
        const v = ['initialize', 'identify', 'updateOptions', 'pageLoad'];

        for (w = 0, x = v.length; w < x; ++w) {
            const m = v[w];
            const func = function () {
                o.q[m === v[0] ? 'unshift' : 'push'](
                    [m].concat([].slice.call(arguments, 0))
                );
            };
            o[m] = o[m] || func();

            y = document.createElement('script');
            y.defer = true;
            y.src = `https://cdn.pendo.io/agent/static/${pendoKey}/pendo.js`;
            y.onload = () => {
                shouldTriggerInitializePendo();
            };
            y.onerror = err => {
                if (!didReportPendoError) {
                    didReportPendoError = true;
                    onPendoLoadError(err);
                }
            };
            z = document.getElementsByTagName('script')[0];
            z.parentNode.insertBefore(y, z);
        }
    }, 1000);
}

fetch(`${thoughtspotHost}/callosum/v1/tspublic/v1/session/info`, {
    headers: {
        accept: "application/json",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
        "cache-control": "no-cache",
        pragma: "no-cache",
        priority: "u=1, i",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin"
    },
    referrer: `${thoughtspotHost}/external/swagger/`,
    referrerPolicy: "strict-origin-when-cross-origin",
    body: null,
    method: "GET",
    mode: "cors",
    credentials: "include"
}).then(async response => {
    infoResponse = await response.json();
    console.log(infoResponse);
}).then(async () => {
    await insertPendoScript();
});
