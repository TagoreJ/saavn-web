var results_container = document.querySelector("#saavn-results")
var results_objects = {};
// 1. UPDATED: Changed to the official documented API URL
const baseApiUrl = "https://saavn.sumit.co/api";

function SaavnSearch() {
event.preventDefault(); // stop page changing to #, which will reload the page
var query = document.querySelector("#saavn-search-box").value.trim()
query = encodeURIComponent(query);

if(query==lastSearch) {doSaavnSearch(query)}
    window.location.hash = lastSearch; 
if(query.length > 0) { 
    window.location.hash = query 
}

}
var page_index = 1;
function nextPage() {
    var query = document.querySelector("#saavn-search-box").value.trim();
    if (!query) {query = lastSearch;}
    query = encodeURIComponent(query);
    doSaavnSearch(query,0,true)
}

// 2. This function remains the same as before
async function doSaavnSearch(query, NotScroll, page) {
    window.location.hash = query;
    document.querySelector("#saavn-search-box").value = decodeURIComponent(query);
    if (!query) { return 0; }
    results_container.innerHTML = `<span class="loader">Searching</span>`;

    // --- START NEW LOGIC ---
    // Get the selected search type from the radio buttons in index.html
    var searchType = document.getElementById('search-type-album').checked ? 'albums' : 'songs';
    
    // Set the API URL based on the search type
    var searchUrl = (searchType === 'albums') 
        ? `${baseApiUrl}/search/albums?query=` 
        : `${baseApiUrl}/search/songs?query=`;
    // --- END NEW LOGIC ---

    query = query + "&limit=40";
    if (page) {
        ; page_index = page_index + 1; query = query + "&page=" + page_index;
    } else { query = query + "&page=1"; page_index = 1; }

    try {
        var response = await fetch(searchUrl + query);
    } catch (error) {
        results_container.innerHTML = `<span class="error">Error: ${error} <br> Check if API is down </span>`;
    }
    var json = await response.json();
    
    if (response.status !== 200 || !json.data) {
        results_container.innerHTML = `<span class="error">Error: ${json.message || 'API error'}</span>`;
        console.log(response)
        return 0;
    }
    var json = json.data.results;
    var results = [];
    if (!json) { results_container.innerHTML = "<p> No result found. Try other Library </p>"; return; }
    lastSearch = decodeURI(window.location.hash.substring(1));

    // --- START CONDITIONAL RENDERING ---
    if (searchType === 'songs') {
        // This is your EXISTING loop for songs
        for (let track of json) {
            song_name = TextAbstract(track.name, 25);
            album_name = TextAbstract(track.album.name, 20);
            if (track.album.name == track.name) {
                album_name = ""
            }
            var measuredTime = new Date(null);
            measuredTime.setSeconds(track.duration);
            var play_time = measuredTime.toISOString().substr(11, 8);
            if (play_time.startsWith("00:0")) {
                play_time = play_time.slice(4);
            }
            if (play_time.startsWith("00:")) {
                play_time = play_time.slice(3);
            }
            var song_id = track.id;
            var year = track.year;
            var song_image = track.image[1].link;
            var song_artist = TextAbstract(track.primaryArtists, 30);
            var bitrate = document.getElementById('saavn-bitrate');
            var bitrate_i = bitrate.options[bitrate.selectedIndex].value;
            if (track.downloadUrl) {
                var download_url = track.downloadUrl[bitrate_i]['link'];
                var quality = "";
                if (bitrate_i == 4) { quality = 320 } else { quality = 160; }
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
                        <p class="float-right fit-content" style="margin:0px;color:#fff;padding-right:11px;padding-top:15px;">${play_time}<br/></p>
                    </div>
                </div>
            </div>
            `);
            }
        }
    } else {
        // This is our NEW loop for albums
        for (let album of json) {
            // Note: The API data structure is slightly different for albums
            let album_name = TextAbstract(album.name, 25);
            let album_id = album.id;
            let album_image = album.image[1].link;
            // Handle case where artists might be missing
            let album_artist = "Unknown Artist";
            if (album.artists && album.artists.primary) {
                album_artist = TextAbstract(album.artists.primary.map(a => a.name).join(', '), 30);
            } else if (album.artists) {
                 album_artist = TextAbstract(album.artists, 30);
            }
            
            let year = album.year;

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
                        
                        <button class="btn btn-primary song-btn" type="button" style="margin:0px 2px;" onclick='getAlbumSongs("${album_id}")'>View Songs</button>
                    </div>
                </div>
            </div>
            `);
        }
    }
    // --- END CONDITIONAL RENDERING ---

    results_container.innerHTML = results.join(' ');
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
if(window.location.hash) {
   doSaavnSearch(window.location.hash.substring(1));
} else {doSaavnSearch('english',1);}

addEventListener('hashchange', event => { });
onhashchange = event => {doSaavnSearch(window.location.hash.substring(1))};

// If Bitrate changes, search again
$('#saavn-bitrate').on('change', function () {
    doSaavnSearch(lastSearch);
        /*
    var isDirty = !this.options[this.selectedIndex].defaultSelected;

    if (isDirty) {
        // Value Changed
        doSaavnSearch(lastSearch)
    } else {
        // Do Nothing
    } */
});
document.getElementById("loadmore").addEventListener('click',nextPage)


// 3. This new function also remains the same
async function getAlbumSongs(albumId) {
    results_container.innerHTML = `<span class="loader">Loading Songs...</span>`;

    // Use the new /api/albums endpoint
    var response = await fetch(`${baseApiUrl}/albums?id=${albumId}`);
    var json = await response.json();

    if (response.status !== 200 || !json.data) {
        results_container.innerHTML = `<span class="error">Error: Could not load album.</span>`;
        return;
    }

    var albumName = json.data.name;
    var songs = json.data.songs; // Get the list of songs from the album
    var results = [];

    // We re-use the same song rendering logic from doSaavnSearch
    for (let track of songs) {
        song_name = TextAbstract(track.name, 25);
        // We already have the album name from the parent object
        album_name = TextAbstract(albumName, 20);

        var measuredTime = new Date(null);
        measuredTime.setSeconds(track.duration);
        var play_time = measuredTime.toISOString().substr(11, 8);
        if (play_time.startsWith("00:0")) {
            play_time = play_time.slice(4);
        }
        if (play_time.startsWith("00:")) {
            play_time = play_time.slice(3);
        }
        var song_id = track.id;
        var year = track.year;
        var song_image = track.image[1].link;
        // Handle different artist structures
        var song_artist = "Unknown Artist";
         if (track.artists && track.artists.primary) {
            song_artist = TextAbstract(track.artists.primary.map(a => a.name).join(', '), 30);
         } else if (track.primaryArtists) {
             song_artist = TextAbstract(track.primaryArtists, 30);
         }
        
        var bitrate = document.getElementById('saavn-bitrate');
        var bitrate_i = bitrate.options[bitrate.selectedIndex].value;
        if (track.downloadUrl) {
            var download_url = track.downloadUrl[bitrate_i]['link'];
            var quality = "";
            if (bitrate_i == 4) { quality = 320 } else { quality = 160; }
            
            results_objects[song_id] = {
                // Store track data for the download function
                track: {
                    name: track.name,
                    album: { name: albumName },
                    image: track.image
                }
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
                    <p class="float-right fit-content" style="margin:0px;color:#fff;padding-right:11px;padding-top:15px;">${play_time}<br/></p>
                </div>
            </div>
        </div>
        `);
        }
    }

    results_container.innerHTML = results.join(' ');
    document.getElementById("saavn-results").scrollIntoView();
}