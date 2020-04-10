// Client side interface for Node server comic search API

// change this variable appropriately depending on which environment you're running this script in
const baseUrl = "http://localhost:3001";

function callApi(api, param, cb) {
    param = encodeURIComponent(param.trim());
    fetch(`${baseUrl}/api/${api}/${param}`)
        .then(response => response.json())
        .then(data => {
            return cb(data);
        });
}

const marvelApi = {
    // Search for characters by name
    getCharacters: function (name, cb) {
        callApi("characters/name", name, cb);
    },

    // Search for comics by title
    getComics: function(title, cb) {
        callApi("comics/title", title, cb);
    }
};

export default marvelApi;
