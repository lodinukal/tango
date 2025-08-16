// Type definitions for set progress
export type SetModeProgress = {
    mode: string;
    progress: Map<number, number>;
    total: number;
};

export type SetProgress = {
    setModeProgresses: SetModeProgress[];
};
