//  This is a Constructor function taking id and path 
//  as the paramaters
function ImageDetails(id, name, path, isAlbum, album, tags) {
  this.id = id;
  this.path = path;
  this.name = name;
  this.isAlbum = isAlbum;
  this.album = album;
  this.tags = tags;
}
// Sets the id
// 
ImageDetails.prototype.setId = function(id) {
    this.id = id;
};
// Gets the id
ImageDetails.prototype.getId = function() {
    return this.id;
};

// Sets the id
// 
ImageDetails.prototype.setName = function(name) {
    this.name = name;
};
// Gets the id
ImageDetails.prototype.getName = function() {
    return this.name;
};

// Sets the isAlbum
ImageDetails.prototype.setIsAlbum = function(isAlbum) {
    this.isAlbum = isAlbum;
};
// Gets the isAlbum
ImageDetails.prototype.isAlbum = function() {
    return this.isAlbum;
};

// Sets the album
ImageDetails.prototype.setAlbum = function(album) {
    this.album = album;
};
// Gets the album
ImageDetails.prototype.getAlbum = function() {
    return this.album;
};

// Sets the path
// 
ImageDetails.prototype.setPath = function(path) {
    this.path = path;
};

// Gets the path
// 
ImageDetails.prototype.getPath = function() {
    return this.path;
};

// Sets the tagss
// 
ImageDetails.prototype.setTags = function(tags) {
    this.tags = tags;
};
// Gets the id
ImageDetails.prototype.getTags = function() {
    return this.tags;
};

module.exports = ImageDetails;