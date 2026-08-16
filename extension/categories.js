const CATEGORIES=[
    "Productivity",
    "Learning",
    "Social Media",
    "Entertainment",
    "Shopping",
    "Other"
];

const CATEGORY_OVERRIDE_STORAGE_KEY="categoryOverrides";

const CATEGORY_META={
    Productivity:{
        color: "#5E7CE2"
    },
    Learning:{
        color: "#3B9B7A"
    },
    "Social Media":{
        color: "#B56FD8"
    },
    Entertainment:{
        color: "#D98255"
    },
    Shopping:{
        color: "#C99B38"
    },
    Other:{
        color: "#8793A5"
    }
};

const DOMAIN_CATEGORIES={
    "github.com": "Productivity",
    "notion.so": "Productivity",
    "docs.google.com": "Productivity",
    "drive.google.com": "Productivity",
    "slack.com": "Productivity",

    "leetcode.com": "Learning",
    "chatgpt.com": "Learning",
    "coursera.org": "Learning",
    "udemy.com": "Learning",
    "geeksforgeeks.org": "Learning",

    "instagram.com": "Social Media",
    "facebook.com": "Social Media",
    "twitter.com": "Social Media",
    "x.com": "Social Media",
    "linkedin.com": "Social Media",
    "quora.com": "Social Media",

    "youtube.com": "Entertainment",
    "netflix.com": "Entertainment",
    "spotify.com": "Entertainment",
    "primevideo.com": "Entertainment",

    "amazon.in": "Shopping",
    "amazon.com": "Shopping",
    "flipkart.com": "Shopping",
    "myntra.com": "Shopping"
};

function isValidCategory(category){
    return CATEGORIES.includes(category);
}

function getDefaultCategory(domain){
    if(!domain) return "Other";
    const parts=domain.toLowerCase().split(".");
    for(let i=0;i<parts.length-1;i+=1){
        const candidateDomain=parts.slice(i).join(".");
        if(DOMAIN_CATEGORIES[candidateDomain]) return DOMAIN_CATEGORIES[candidateDomain];
    }
    return "Other";
}

function getCategory(domain, overrides={}){
    const override=overrides[domain];
    if(isValidCategory(override)) return override;
    return getDefaultCategory(domain);
}

function getCategoryColor(category){
    const validCategory=isValidCategory(category)?category:"Other";
    return CATEGORY_META[validCategory].color;
}