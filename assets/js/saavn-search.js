var results_container = document.querySelector("#saavn-results")
var results_objects = {};
var currentSearchType = 'songs';
const baseUrl = "https://saavn.sumit.co/api"; // Using your requested API
const placeholder_image = "https://i.pinimg.com/originals/ed/54/d2/ed54d2fa700d36d4f2671e-1be84651df.jpg"; // Fallback image

// New function to handle tab clicks
function setSearchType(type) {
    // Remove 'active' from all tabs
    document.querySelectorAll('.search-tab').forEach(tab => tab.classList.remove('active'));
    // Add 'active' to the clicked tab
    document.getElementById('search-type-' + type).classList.add('active');
    // Set the global variable
    currentSearchType = type;
}

function SaavnSearch() {
    event.preventDefault(); // stop page changing to #, which will reload the page
    var query = document.querySelector("#saavn-search-box").value.trim()
    query = encodeURIComponent(query);

    if (query == lastSearch) { doSaavnSearch(query, false, false, currentSearchType) }
    window.location.hash = lastSearch;
    if (query.length > 0) {
        window.location.hash = query
    }

}
var page_index = 1;
function nextPage() {
    var query = document.querySelector("#saavn-search-box").value.trim();
    if (!query) { query = lastSearch; }
    query = encodeURIComponent(query);
    doSaavnSearch(query, 0, true, currentSearchType);
}
async function doSaavnSearch(query, NotScroll, page, searchType = 'songs') {
    window.location.hash = query;
    document.querySelector("#saavn-search-box").value = decodeURIComponent(query);
    if (!query) { return 0; }
    results_container.innerHTML = `<span class="loader">Searching</span>`;
    query = query + "&limit=40";
    if (page) {
        ; page_index = page_index + 1; query = query + "&page=" + page_index;
    } else { query = query + "&page=1"; page_index = 1; }

    try {
        var searchUrl = `${baseUrl}/search/${searchType}?query=${query}`;
        var response = await fetch(searchUrl);
    } catch (error) {
        results_container.innerHTML = `<span class="error">Error: ${error} <br> Check if API is down </span>`;
    }
    var json = await response.json();
    
    if (response.status !== 200) {
        results_container.innerHTML = `<span class="error">Error: ${json.message}</span>`;
        console.log(response)
        return 0;
    }
    
    // API data is in data.results
    var json = json.data.results; 
    var results = [];
    if (!json) { results_container.innerHTML = "<p> No result found. Try other Library </p>"; return; }
    lastSearch = decodeURI(window.location.hash.substring(1));

    if (searchType === 'songs') {
        for (let track of json) {

            song_name = TextAbstract(track.name, 25);
            album_name = TextAbstract(track.album.name, 20);
            if (track.album.name == track.name) {
                album_name = ""
            }
            var measuredTime = new Date(null);
            measuredTime.setSeconds(track.duration); // specify value of SECONDS
            var play_time = measuredTime.toISOString().substr(11, 8);
            if (play_time.startsWith("00:0")) {
                play_time = play_time.slice(4);
            }
            if (play_time.startsWith("00:")) {
                play_time = play_time.slice(3);
            }
            var song_id = track.id;
            var year = track.year;
            
            // Safety check for image
            var song_image = (track.image && track.image.length > 1) ? track.image[1].link : placeholder_image;
            
            var song_artist = TextAbstract(track.primaryArtists, 30);
            
            // --- *** THE REAL FIX IS HERE *** ---
            var bitrate_select = document.getElementById('saavn-bitrate');
            var selected_quality = bitrate_select.options[bitrate_select.selectedIndex].text; // Gets "320kbps", "160kbps", etc.

            // Find the download link object that matches the selected quality
            var download_link_object = (track.downloadUrl) ? track.downloadUrl.find(l => l.quality === selected_quality) : null;
            var download_url = download_link_object ? download_link_object.link : null;
            // --- *** END OF FIX *** ---
            
            if (download_url) { // Only show songs that have a valid download link
                results_objects[song_id] = {
                    track: track
                };
                results.push(`
                  <div class="text-left song-container" style="margin-bottom:20px;border-radius:10px;background-color:#1c1c1c;padding:10px;">
                  <div class="row" style="margin:auto;">
                      <div class="col-auto" style="padding:0px;padding-right:0px;border-style:none;">
                          <img id="${song_id}-i" class="img-fluid d-inline" style="width:115px;border-radius:5px;height:115px;padding-right:10px;" src="${song_image}" loading="lazy"/>
                      </div>
                      <div class="col" style="border-style:none;padding:2px;">
                          <p class="float-right fit-content" style="margin:0px;color:#fff;padding-right:10px;">${year}</p>
                          <p id="${song_id}-n" class="fit-content" style="margin:0px;color:#fff;max-width:100%;">${song_name}</p>
                          <p id="${song_id}-a" class="fit-content" style="margin:0px;color:#fff;max-width:100%;">${album_name}<br/></p>
                          <p id="${song_id}-ar" class="fit-content" style="margin:0px;color:#fff;max-width:100%;">${song_artist}<br/></p>
                          <button class="btn btn-primary song-btn" type="button" style="margin:0px 2px;" onclick='PlayAudio("${download_url}","${song_id}")'>▶</button>
                          <button class="btn btn-primary song-btn" type="button" style="margin:0px 2px;" onclick='AddDownload("${song_id}")'>DL</button>
                          <p class="float-right fit-content" style="margin:0px;color:#fff;padding-right:10px;padding-top:15px;">${play_time}<br/></p>
                      </div>
                  </div>
              </div>
            `
                );
            }
        }
    }
    else if (searchType === 'albums') {
        for (let album of json) {
            
            var album_name = TextAbstract(album.name, 25);
            var album_image = (album.image && album.image.length > 1) ? album.image[1].link : placeholder_image;
            var album_id = album.id;
            var year = album.year;
            var album_artist = TextAbstract(album.primaryArtists, 30); 

            results.push(`
                <div class="text-left song-container" style="margin-bottom:20px;border-radius:10px;background-color:#1c1c1c;padding:10px;">
                    <div class="row" style="margin:auto;">
                        <div class="col-auto" style="padding:0px;padding-right:0px;border-style:none;">
                            <img class="img-fluid d-inline" style="width:115px;border-radius:5px;height:115px;padding-right:10px;" src="${album_image}" loading="lazy"/>
                        </div>
                        <div class="col" style="border-style:none;padding:2px;">
                            <p class="float-right fit-content" style="margin:0px;color:#fff;padding-right:10px;">${year}</p>
                            <p class="fit-content" style="margin:0px;color:#fff;max-width:100%;">${album_name}</p>
                            <p class="fit-content" style="margin:0px;color:#fff;max-width:100%;">${album_artist}<br/></p>
                            <button class="btn btn-primary song-btn" type="button" style="margin:0px 2px;" onclick='getAlbumDetails("${album_id}")'>View Songs</button>
                        </div>
                    </div>
                </div>
                `);
        }
    }


    results_container.innerHTML = results.join(' ');
    if(results.length === 0) {
        results_container.innerHTML = "<p> No results found. (Some songs are hidden if they don't have a download link for your selected quality)</p>";
    }
    
    if (!NotScroll) {
        document.getElementById("saavn-results").scrollIntoView();
    }


}
function TextAbstract(text, length) {
    if (text == null) {
        return "";
    }
    if (text.length <= length) {
        return text;
    }
    text = text.substring(0, length);
    last = text.lastIndexOf(" ");
    text = text.substring(0, last);
    return text + "...";
}
if (window.location.hash) {
    doSaavnSearch(window.location.hash.substring(1), false, false, currentSearchType); 
} else { doSaavnSearch('english', 1, false, currentSearchType); }

addEventListener('hashchange', event => { });
onhashchange = event => { doSaavnSearch(window.location.hash.substring(1), false, false, currentSearchType) }; 

$('#saavn-bitrate').on('change', function () {
    doSaavnSearch(lastSearch, false, false, currentSearchType); 
});
document.getElementById("loadmore").addEventListener('click', nextPage)