importScripts("utils.js");

const SESSION_KEY="currentSession";
const HEARTBEAT_ALARM="trackingHeartbeat";
const IDLE_THRESHOLD_SECONDS=60;

let operationQueue=Promise.resolve();

chrome.idle.setDetectionInterval(IDLE_THRESHOLD_SECONDS);
chrome.alarms.create(HEARTBEAT_ALARM, {periodInMinutes:1});

function queueOperation(operation){
    operationQueue=operationQueue.then(operation).catch((error)=>console.error("Tracking error:",error));
    return operationQueue;
}

async function getCurrentSession() {
    const result=await chrome.storage.session.get(SESSION_KEY);
    return result[SESSION_KEY] || null;
}

async function saveCurrentSession(session){
    await chrome.storage.session.set({[SESSION_KEY]:session});
}

async function clearCurrentSession(){
    await chrome.storage.session.remove(SESSION_KEY);
}

async function addTimeToStorage(domain, startTimestamp, endTimestamp){
    let segmentStart=startTimestamp;
    while(segmentStart<endTimestamp){
        const segmentDate=new Date(segmentStart);
        const nextMidnight=new Date(
            segmentDate.getFullYear(),
            segmentDate.getMonth(),
            segmentDate.getDate()+1
        ).getTime();
        const segmentEnd=Math.min(endTimestamp,nextMidnight);
        const seconds=Math.floor((segmentEnd-segmentStart)/1000);

        if(seconds>0){
            const dateKey=getTodayKey(segmentDate);
            const storedData=await chrome.storage.local.get(dateKey);
            const dayData=storedData[dateKey] ||{};
            dayData[domain]=(dayData[domain] || 0)+seconds;
            await chrome.storage.local.set({[dateKey]:dayData});
        }
        segmentStart=segmentEnd;
    }
}

async function flushCurrentSession(){
    const session=await getCurrentSession();
    if(!session) return;
    const now=Date.now();
    await addTimeToStorage(session.domain, session.startTimestamp,now);
    await saveCurrentSession({
        ...session,
        startTimestamp:now
    });
}

async function pauseTracking(){
    const session=await getCurrentSession();
    if(!session) return;
    await flushCurrentSession();
    await clearCurrentSession();
}

async function startTracking(tab){
    const domain=getDomainFromUrl(tab.url);
    if(!domain) return ;
    await saveCurrentSession({domain, tabId:tab.id, startTimestamp: Date.now()});
}

async function syncTracking(){
    const idleState=await chrome.idle.queryState(IDLE_THRESHOLD_SECONDS);

    if(idleState!=="active"){
        await pauseTracking();
        return;
    }
    const [activeTab]= await chrome.tabs.query({
        active:true,
        lastFocusedWindow:true
    });
    if(!activeTab){
        await pauseTracking();
        return;
    }
    const domain=getDomainFromUrl(activeTab.url);
    const session=await getCurrentSession();

    if(!domain){
        await pauseTracking();
        return;
    }
    if(session && session.domain==domain) return;
    await pauseTracking();
    await startTracking(activeTab);
}

chrome.tabs.onActivated.addListener(()=>{
    queueOperation(syncTracking);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab)=>{
    if(tab.active && (changeInfo.url || changeInfo.status==="completed")){
        queueOperation(syncTracking);
    }
});

chrome.windows.onFocusChanged.addListener((windowId)=>{
    queueOperation(async ()=>{
        if(windowId===chrome.windows.WINDOW_ID_NONE){
            await pauseTracking();
            return;
        }
        await syncTracking();
    });
});

chrome.idle.onStateChanged.addListener((state)=>{
    queueOperation(async ()=>{
        if(state==="active"){
            await syncTracking();
            return;
        }
        await pauseTracking();
    });
});

chrome.alarms.onAlarm.addListener((alarm)=>{
    if(alarm.name!==HEARTBEAT_ALARM) return;
    queueOperation(async ()=>{
        const idleState=await chrome.idle.queryState(
            IDLE_THRESHOLD_SECONDS
        );
        if(idleState==="active"){
            await flushCurrentSession();
        }else{
            await pauseTracking();
        }
    });
});

chrome.runtime.onStartup.addListener(()=>{
    queueOperation(syncTracking);
});

chrome.runtime.onInstalled.addListener(()=>{
    queueOperation(syncTracking);
});

queueOperation(syncTracking);