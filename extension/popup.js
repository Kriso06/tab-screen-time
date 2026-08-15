const usageList=document.getElementById("usage-list");
const totalTime=document.getElementById("total-time");

function createUsageRow(domain, seconds){
    const row=document.createElement("div");
    row.className="usage-row";

    const domainElement=document.createElement("span");
    domainElement.className="domain";
    domainElement.textContent=domain;

    const timeElement=document.createElement("span");
    timeElement.className="time";
    timeElement.textContent=formatDuration(seconds);

    row.append(domainElement, timeElement);
    return row;
}

function renderUsage(usage){
    const entries=Object.entries(usage).sort(
        (first, second)=>second[1]-first[1]
    );

    const totalSeconds=entries.reduce(
        (total, [, seconds])=>total+seconds,0
    );

    totalTime.textContent=formatDuration(totalSeconds);
    usageList.innerHTML="";

    if(entries.length===0){
        usageList.innerHTML='<p class="empty-state">No tracked website usage yet.</p>';
        return;
    }

    for(const [domain,seconds] of entries){
        usageList.append(createUsageRow(domain,seconds));
    }
}

async function loadUsage(){
    try{
        const response=await chrome.runtime.sendMessage({
            type:"GET_TODAYS_USAGE"
        });
        renderUsage(response.usage);
    }catch(error){
        console.error("Could not load usage:", error);
        usageList.innerHTML='<p class="empty-state">Could not load usage.</p>';
    }
}

loadUsage();