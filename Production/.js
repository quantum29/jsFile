/**
 * Copyright: ThoughtSpot Inc. 2025
 * Author: Priyanshu Kumar (priyanshu.kumar@thoughtspot.com)
 *
 * Expects this in init():
 * init({
 *   ...,
 *   customVariablesForThirdPartyTools: {
 *     pendoKey: '<PENDO_KEY>',
 *     hostName: '<THOUGHTSPOT_HOST>'
 *   }
 * });
 */

const windowObj = window;

console.log("CustomVariablesFor3rdPartyTools", windowObj.tsEmbed);

const infoResponse = {
    userGUID: '',
    clusterId: '',
    clusterName: '',
};

// Get values from tsEmbed
const pendoKey = windowObj.tsEmbed?.pendoKey;
const thoughtspotHost = windowObj.tsEmbed?.hostName;

function getPendoVisitorConfig() {
    const config = {
        id: `${infoResponse.userGUID}|${infoResponse.clusterId}`,
    };
    console.log("Visitor config:", config);
    return config;
}

function getPendoAccountConfig() {
    const config = {
        id: infoResponse.clusterId,
        name: infoResponse.clusterName,
    };
    console.log("Account config:", config);
    return config;
}

async function initializePendo() {
    try {
        await windowObj.pendo.initialize({
            apiKey: pendoKey,
            visitor: getPendoVisitorConfig(),
            account: getPendoAccountConfig(),
        });
        console.log("✅ Pendo is initialized!");
    } catch (err) {
        console.error("❌ Error initializing Pendo:", err);
    }
}

function onPendoLoadError(err) {
    console.warn("❌ Unable to load Pendo script:", err);
}

async function insertPendoScript() {
    return setTimeout(() => {
        const pendoStub = (windowObj.pendo = windowObj.pendo || {});
        pendoStub.q = [];

        const stubMethods = ['initialize', 'identify', 'updateOptions', 'pageLoad'];
        stubMethods.forEach(method => {
            pendoStub[method] = pendoStub[method] || function () {
                pendoStub.q.push([method].concat([].slice.call(arguments)));
            };
        });

        const script = document.createElement('script');
        script.defer = true;
        script.src = `https://cdn.pendo.io/agent/static/${pendoKey}/pendo.js`;

        script.onload = () => {
            console.log("✅ Pendo script loaded");
            initializePendo();
        };

        script.onerror = onPendoLoadError;

        const firstScript = document.getElementsByTagName('script')[0];
        firstScript.parentNode.insertBefore(script, firstScript);
    }, 1000);
}

async function fetchUserAndClusterInfo() {
    if (!thoughtspotHost || !pendoKey) {
        console.error("❌ Missing tsEmbed.pendoKey or tsEmbed.hostName");
        return;
    }

    const commonOptions = {
        headers: {
            Accept: 'application/json',
        },
        credentials: 'include',
    };

    try {
        const [userRes, systemRes] = await Promise.all([
            fetch(`${thoughtspotHost}/api/rest/2.0/auth/session/user`, commonOptions),
            fetch(`${thoughtspotHost}/api/rest/2.0/system`, commonOptions),
        ]);

        const userData = await userRes.json();
        const systemData = await systemRes.json();

        infoResponse.userGUID = userData?.id || '';
        infoResponse.clusterId = systemData?.id || '';
        infoResponse.clusterName = systemData?.id || '';

        console.log("📦 Fetched infoResponse:", infoResponse);
    } catch (err) {
        console.error("❌ Error fetching user or cluster info:", err);
    }
}

// Bootstrapping
fetchUserAndClusterInfo().then(insertPendoScript);
