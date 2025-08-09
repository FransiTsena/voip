export interface IVREntry {
    id: number;
    type: string;
    digit: string;
    value: string;
}

export interface DTMFOptions {
    announcement: {id: string, name: string};
    timeout: number;
    invalidRetries: number;
    invalidRetryRecording: {id: string, name: string};
    timeoutRetries: number;
}

export interface IVRState {
    name: string;
    description: string;
    dtmf: DTMFOptions;
    entries: IVREntry[];
}

export interface ErrorState {
    name?: string;
    announcement?: string;
    timeout?: string;
    invalidRetries?: string;
    timeoutRetries?: string;
}
