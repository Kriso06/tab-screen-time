function getTodayKey(){
    const today=new Date();
    const year=today.getFullYear();
    const month=String(today.getMonth()+1).padStart(2,"0");
    const day= String(today.getDate()).padStart(2,"0");
    return `${year}-${month}-${day}`;
}

function getDomainFromUrl(url){
    try{
        const parsedUrl= new URL(url);

        if(
            parsedUrl.protocol!=="http:" && 
            parsedUrl.protocol!=="https:"
        ){
            return null;
        }
        return parsedUrl.hostname.replace(/^www\./, "");
    }catch{
        return null;
    }
}

function formatDuration(totalSeconds){
    const minutes=Math.floor(totalSeconds/60);
    const hours=Math.floor(minutes/60);
    const remainingMinutes=minutes%60;
    if(hours>0){
        return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
}