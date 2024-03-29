/**
 * @typedef SetData
 * @property {SetItem[]} items
 * @property {SetInfo} info
 */

/**
 * @typedef SetInfo
 * @property {string} name
 */

/**
 * @typedef SetItem
 * @property {number} id
 * @property {string} word
 * @property {string} kana
 * @property {string} audio
 * @property {string[]} examples
 * @property {string?} hint
 */

let audio_player = new Audio();

/**
 * @typedef LocalList
 * @prop {string} id
 * @prop {string} json
 */

/**
 * @param {string} audio
 * @param {boolean} must
 */
export const playAudio = async (audio, must) => {
    if (!audio_player.paused && !must) {
        return;
    }
    audio_player.src = audio;
    audio_player.load();
    audio_player.play().catch(() => {
        audio_player.pause();
    });
};