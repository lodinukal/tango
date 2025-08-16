/**
 * Type definitions for set data
 */
export type SetInfo = {
    name: string;
};

export type SetItem = {
    id: number;
    word: string;
    kana: string;
    audio: string;
    examples: string[];
    hint?: string;
};

export type SetData = {
    items: SetItem[];
    info: SetInfo;
};

let audio_player = new Audio();

export type LocalList = {
    id: string;
    json: string;
};

export const playAudio = async (audio: string, must: boolean): Promise<void> => {
    if (!audio_player.paused && !must) {
        return;
    }
    audio_player.src = audio;
    audio_player.load();
    audio_player.play().catch(() => {
        audio_player.pause();
    });
};
