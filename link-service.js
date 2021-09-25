import fetch from 'node-fetch';

function getVideoSearchUrl(query) {
    params = "";
    query.array.forEach(element => {
        params += element + " ";
    });
    params.trim();
    params.replace(" ","+");
    searchData = getSearchData(params);
}

function getSearchData(params) {
    response = await fetch('https://www.google.com/search?q='+'&source=lnms&tbm=vid');
    const data = await response.json();
    return data
}
