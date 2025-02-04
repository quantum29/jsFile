/**
 * Copyright: ThoughtSpot Inc. 2020
 * @fileoverview Pendo Service File
 */

let pendoOpts = null;

const pendoKey = window.tsEmbed.pendoKey;
const LOCAL_CLUSTER_ID = 'local';
let LOADED_SCRIPTS_NUMBER = 0;

function getPendoVisitorConfig(version) {
    const currentDateISOString = new Date().toISOString();
    const visitorId = pendoOpts.getHostConfig()
        ? `${pendoOpts.getHostConfig().hostUserGuid}|${pendoOpts.getHostConfig().hostClusterId}`
        : `${pendoOpts.getUserGuid()}|${pendoOpts.getClusterId()}`;
    const clusterId = (pendoOpts.getHostConfig() && pendoOpts.getHostConfig().hostClusterId) || pendoOpts.getClusterId();
    const config = {
        id: visitorId,
        isAdminUser: pendoOpts.hasAdminPrivileges(),
        firstLoginDate: new Date(pendoOpts.getFirstLoginDate()).toISOString(),
        embedUser: pendoOpts.isEmbedded(),
        userLocale: pendoOpts.getPreferredLocale(),
        lastLogin: currentDateISOString,
        releaseVersion: version,
        hasEmail: !!pendoOpts.getUserEmail(),
        userPersona: pendoOpts.getUserPersona(),
        $email: pendoOpts.getUserEmail(),
        acquisitionChannel: pendoOpts.getUserActivationMode(),
        hasSearchAssist: pendoOpts.isAAQEnabled(),
        hasHomePageV2: pendoOpts.isHomeV2Enabled(),
        isLiveboardEnabled: pendoOpts.getIsLiveboardEnabled(),
        documentationLink: pendoOpts.getDocumentationLink(),
        teamId: pendoOpts.getTeamId(),
        isInIframe: pendoOpts.isInIframe(),
        orgId: pendoOpts.getOrgId(),
        clusterId: clusterId,
        isGlobalNavEnabled: pendoOpts.isGlobalNavEnabled(),
        isRolesEnabled: pendoOpts.isRolesEnabled(),
        userType: pendoOpts.userType(),
    };
    return config;
}

function getPendoAccountConfig() {
    const config = {
        id: (pendoOpts.getHostConfig() && pendoOpts.getHostConfig().hostClusterId) || pendoOpts.getClusterId(),
        name: (pendoOpts.getHostConfig() && pendoOpts.getHostConfig().hostClusterName) || pendoOpts.getClusterName(),
    };
    return config;
}

function initializePendo() {

    const releaseVersion = pendoOpts.getReleaseVersion();
    window.pendo.initialize({
        apiKey: pendoKey,
        visitor: getPendoVisitorConfig(releaseVersion),
        account: getPendoAccountConfig(),
        disableGuides: pendoOpts.isEmbedded(),
        additionalApiKeys: [pendoOpts.additionalPendoKey]
    });
}

/**
 * The function is triggered whenever a script onLoad is complete
 */
function shouldTriggerInitializePendo() {
    LOADED_SCRIPTS_NUMBER += 1;

    if (LOADED_SCRIPTS_NUMBER === 4) {
        console.log("initializePendo after this");
        initializePendo();

         setTimeout(() => {
              if (window.pendo && typeof window.pendo.validateInstall === 'function') {
                          console.log("pendo is initialised");
                          console.log("pendo.validateInstall()");
                          console.log(pendo.validateInstall());
                          console.log("pendo.validateEnvironment()");
                          console.log(pendo.validateEnvironment());
                  console.log("Pendo validated successfully.");
              } else {
                  console.error("Pendo validateInstall is not available.");
              }
        },5000); 
    }
}

function onPendoLoadError(err) {
    console.log('Unable to load Pendo', err);
}

/*
 * Inserts some <script> elements onto the page, to load Pendo. The reason some
 * of the code appears minimized/obfuscated is because Pendo gave us this code
 * already in that state, and informed us to use it as-is. It is okay to amend
 * this code with non-minimized code if desired, however.
 */
async function insertPendoScript() {
    pendoOpts = window.pendoInitVariables;
    // defer pendo script addition by 3 seconds
    return setTimeout(() => {
        let w;
        let x;
        let y;
        let z;
        let didReportPendoError = false;
        const o = (window.pendo = window.pendo || {});
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


insertPendoScript();
