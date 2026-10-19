// The upstream gist-sharing network calls were removed (see CHANGES.md).
// Every function fails locally, nothing leaves the device.
export const SHARE_FILENAME = "share.json";
export const VERSION_FILENAME = "versionned.json";

const off = async () => {
  throw new Error("device-only");
};

export const create = off;
export const patch = off;
export const del = off;
export const get = off;
export const getCommits = off;
export const getVersion = off;
export const getCommitsWithFile = off;
export const compare = off;
