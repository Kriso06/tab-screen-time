function parseLocalDateKey(dateKey){
    const [year, month, day]=dateKey.split("-").map(Number);
    return new Date(year, month-1, day);
}

function getStartOfWeek(date=new Date()){
    const start=new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );
    const dayOfWeek=start.getDate();
    const daysSinceMonday=dayOfWeek===0?6:dayOfWeek-1;
    start.setDate(start.getDate()-daysSinceMonday);
    return start;
}

function getCurrentWeekDays(referenceDate= new Date()){
    const start=getStartOfWeek(referenceDate);
    const dayCount= Math.floor(
        (
            new Date(
                referenceDate.getFullYear(),
                referenceDate.getMonth(),
                referenceDate.getDate()
            ) - start
        ) / 86_400_000
    ) +1;
    return Array.from({ length: dayCount}, (_,index) =>{
        const date= new Date(start);
        date.setDate(start.getDate()+index);

        return {
            date, dateKey: getTodayKey(date), label: new Intl.DateTimeFormat(undefined,{
                weekday:"short"
            }).format(date)
        };
    });
}

function formatWeekRange(weekDays){
    if(weekDays.length===0) return "";
    const firstDate=weekDays[0].date;
    const lastDate=weekDays[weekDays.length-1].date;
    const includeYear=firstDate.getFullYear()!==lastDate.getFullYear();
    const formatter=new Intl.DateTimeFormat(undefined,{
        month:"short",
        day:"numeric",
        ...arguments(includeYear?{year:"numeric"}:{})
    });
    return `${formatter.format(firstDate)}-${formatter.format(lastDate)}`;
}

function createEmptyCategoryTotals(){
    return Object.fromEntries(
        CATEGORIES.map((category)=>[category, 0])
    );
}

function getWeeklyAnalytics(
    allStorageData,
    categoryOverrides={},
    referenceDate=new Date()
){
    const weekDays=getCurrentWeekDays(referenceDate);
    const categoryTotals=createEmptyCategoryTotals();
    const websiteTotals={};
    const dailyTotals=[];
    let totalSeconds=0;
    for(const weekDay of weekDays){
        const dayUsage=allStorageData[weekDay.dateKey] ||{};
        let dayTotal=0;
        for(const [domain, seconds] of Object.entries(dayUsage)){
            if(!Number.isFinite(seconds) || seconds<=0) continue;
            const category=getCategory(domain, categoryOverrides);

            categoryTotals[category]+=seconds;
            websiteTotals[domain]=(websiteTotals[domain] || 0) +seconds;
            dayTotal+=seconds;
        }
        dailyTotals.push({
            ...weekDay,
            totalSeconds: dayTotal
        });
        totalSeconds+=dayTotal;
    }
    const representedDays=weekDays.length;
    const categoryAverages=Object.fromEntries(
        CATEGORIES.map((category)=>[
            category,
            representedDays===0?0:categoryTotals[category]/representedDays
        ])
    );

    return {
        weekDays,
        weekRange: formatWeekRange(weekDays),
        representedDays,
        totalSeconds,
        websiteTotals,
        categoryTotals,
        categoryAverages,
        dailyTotals
    };
}