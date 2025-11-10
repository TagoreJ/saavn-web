function PlayAudio(audio_url, song_id) {
    
  var audio = document.getElementById('player');
  var source = document.getElementById('audioSource');
  source.src = audio_url;
  var name = document.getElementById(song_id+"-n").textContent;
  var album = document.getElementById(song_id+"-a").textContent;
  var image = document.getElementById(song_id+"-i").getAttribute("src");
    
document.title = name+" - "+album;
var bitrate = document.getElementById('saavn-bitrate');
var bitrate_i = bitrate.options[bitrate.selectedIndex].value;
var quality = "";
if (bitrate_i == 4) {quality = 320} else {quality = 160;}


    document.getElementById("player-name").innerHTML = name;
        document.getElementById("player-album").innerHTML = album;
document.getElementById("player-image").setAttribute("src",image);

var promise = audio.load();
if (promise) {
    //Older browsers may not return a promise, according to the MDN website
    promise.catch(function(error) { console.error(error); });
}//call this to just preload the audio without playing
  audio.play(); //call this to play the song right away
};
function searchSong(search_term) {
    
document.getElementById('search-box').value=search_term;
var goButton = document.getElementById("search-trigger");
            goButton.click();
    
}
var DOWNLOAD_API = "https://openmp3compiler.astudy.org"
function AddDownload(id) {
    var bitrate = document.getElementById('saavn-bitrate');
    var bitrate_i = bitrate.options[bitrate.selectedIndex].value;
    // MP3 server API
    var MP3DL = DOWNLOAD_API+"/add?id="+id;
    // make api call, if 200, add to download list
    fetch(MP3DL)
    .then(response => response.json())
    .then(data => {
        if (data.status == "success") {
            // add to download list
            var download_list = document.getElementById("download-list");
            var download_item = document.createElement("li");
           /*
           <li>
                    <div class="col">
                        
                        <img src="https://i.pinimg.com/originals/ed/54/d2/ed54d2fa700d36d4f2671e-1be84651df.jpg" width="50px">
                        <div style="display: inline;">
                        <span id="download-name">Song</span>
                        <span id="download-album">Album</span>
                        <br>
                        <span id="download-size">Size</span>
                        <span id="download-status" style="color:green">Compiling.</span>
                        </div>
                    </div>
                    <hr>
                    </li>
           */
            // download_item.innerHTML = '<div class="col"><img src="'+data.image+'" width="50px"><div style="display: inline;"><span id="download-name">'+id+'</span><span id="download-album">'+data.album+'</span><br><span id="download-size">'+data.size+'</span><span id="download-status" style="color:green">Compiling.</span></div></div><hr>';
            download_item.innerHTML = `
            <div class="col">
            <img class="track-img" src="${data.image}" width="50px">
            <div style="display: inline;">
              <span class="track-name"> ${id}</span> - 
              <span class="track-album"> ${data.album}</span>
              <br>
              <span class="track-size"> Size : Null</span>
              <span class="track-status" style="color:green"> </span>
            </div>
          </div>
          <hr>
            `;

            // set download_item track_tag to song id
            download_item.setAttribute("track_tag",id);
            
            // set css class no-bullets
            download_item.className = "no-bullets";

            download_list.appendChild(download_item);
            // every 5 seconds, check download status
            var STATUS_URL = DOWNLOAD_API+"/status?id="+id;
            // get download_status_span by track_tag and class
            var download_status_span = document.querySelector('[track_tag="'+id+'"] .track-status');
            var download_name = document.querySelector('[track_tag="'+id+'"] .track-name');
            var download_album = document.querySelector('[track_tag="'+id+'"] .track-album');
            var download_img = document.querySelector('[track_tag="'+id+'"] .track-img');
            var download_size = document.querySelector('[track_tag="'+id+'"] .track-size');
            
            // --- FIXED CHECK ---
            // Check if results_objects[id] and its properties exist before accessing
            if (results_objects[id] && results_objects[id].track) {
                download_name.innerHTML = results_objects[id].track.name;
                if (results_objects[id].track.album) {
                    download_album.innerHTML = results_objects[id].track.album.name;
                }
                if (results_objects[id].track.image && results_objects[id].track.image.length > 2) {
                    download_img.setAttribute("src", results_objects[id].track.image[2].link);
                }
            }
            download_status_span.innerHTML = data.status;

            
            // change mpopupLink background and border color to green and back to blue after 1 second
            var float_tap = document.getElementById('mpopupLink');
            float_tap.style.backgroundColor = "green";
            float_tap.style.borderColor = "green";

            setTimeout(function() {
                float_tap.style.backgroundColor = "#007bff";
                float_tap.style.borderColor = "#007bff";
            }, 1000);
            
            // check status every 5 seconds
            var interval = setInterval(function() {
                fetch(STATUS_URL)
                .then(response => response.json())
                .then(data => {
                    if (data.status) {
                        // update status
                        download_status_span.textContent = data.status;
                        if(data.size) {
                            download_size.textContent = "Size: "+data.size;
                        }
                        if (data.status == "Done") {
                            // download complete, add download button
                            download_status_span.innerHTML = `<a href="${DOWNLOAD_API}${data.url}" target="_blank">Download MP3</a>`;
                            // clear interval
                            clearInterval(interval);
                            return;
                  }}
              });}, 3000); // end interval
        } });}

// --- NEW FUNCTIONS START HERE ---

const placeholder_image = "https://i.pinimg.com/originals/ed/54/d2/ed54d2fa700d36d4f2671e-1be84651df.jpg"; // Fallback image

// New function to fetch and display songs from an album
async function getAlbumDetails(albumId) {
    var results_container = document.querySelector("#saavn-results");
    results_container.innerHTML = `<span class="loader">Loading album...</span>`;
    document.getElementById("loadmore").style.display = 'none'; // Hide "Load More"

    try {
        var response = await fetch(`https://saavn.sumit.co/api/albums?id=${albumId}`);
        var data = await response.json();

        if (response.status !== 200 || !data.data) {
            results_container.innerHTML = `<span class="error">Error: Could not load album.</span>`;
            return;
        }

        var album = data.data;
        var songs = album.songs;
        var results = [];
        results_objects = {}; // Clear previous results

        for (let track of songs) {
            var song_name = TextAbstract(track.name, 25);
            var album_name = TextAbstract(album.name, 20); // Use album name
            if (album.name == track.name) album_name = "";

            var measuredTime = new Date(null);
            measuredTime.setSeconds(track.duration);
            var play_time = measuredTime.toISOString().substr(11, 8);
            if (play_time.startsWith("00:0")) play_time = play_time.slice(4);
            if (play_time.startsWith("00:")) play_time = play_time.slice(3);

            var song_id = track.id;
            var year = track.year;
            
            // --- FIXED IMAGE ---
            var song_image = (track.image && track.image.length > 1) ? track.image[1].link : placeholder_image;
            
            var song_artist = TextAbstract(track.primaryArtists, 30);
            
            var bitrate = document.getElementById('saavn-bitrate');
            var bitrate_i = bitrate.options[bitrate.selectedIndex].value;
            
            // --- FIXED DOWNLOAD URL ---
            var download_url = (track.downloadUrl && track.downloadUrl.length > bitrate_i) ? track.downloadUrl[bitrate_i].link : null;

            if (download_url) { // Only show songs that have a valid download link
                
                results_objects[song_id] = { 
                    track: {
                        ...track,
                        album: { name: album.name }, 
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
                            <p class="float-right fit-content" style="margin:0px;color:#fff;padding-right:10px;padding-top:15px;">${play_time}<br/></p>
                        </div>
                    </div>
                </div>
                `);
            }
        }
        results_container.innerHTML = results.join(' ');
        document.getElementById("saavn-results").scrollIntoView();

    } catch (error) {
        console.error(error);
        results_container.innerHTML = `<span class="error">Error: ${error}</span>`;
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