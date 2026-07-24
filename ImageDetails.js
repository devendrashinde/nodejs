/**
 * ImageDetails - Represents either an album or a photo/file
 * Used for displaying gallery items in the UI
 */
export default class ImageDetails {
  constructor(id, name, path, isAlbum, album, tag = null) {
    this.id = id;
    this.name = name;
    this.path = path;
    this.isAlbum = isAlbum;
    this.album = album;
    this.tag = tag;
    this.fileSize = null;
    this.fileSizeFormatted = null;
    this.fileDate = null;
    this.customThumbnail = null;
    this.coverUrl = null;
    this.coverType = null;
    this.itemCount = 0;
    this.description = '';
  }

  /**
   * Get the album name - returns the path or album name depending on context
   */
  getAlbumName() {
    return this.album || this.name;
  }

  /**
   * Get the full path to the image/album
   */
  getPath() {
    return this.path;
  }

  /**
   * Get the filename or directory name
   */
  getName() {
    return this.name;
  }

  /**
   * Check if this is an album/directory
   */
  isDirectory() {
    return this.isAlbum;
  }

  /**
   * Get a unique identifier for this item
   */
  getId() {
    return this.id;
  }

  /**
   * Get the tag associated with this item
   */
  getTag() {
    return this.tag;
  }
}
