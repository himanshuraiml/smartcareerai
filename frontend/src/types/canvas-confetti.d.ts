declare module 'canvas-confetti' {
    export interface Options {
        particleCount?: number;
        angle?: number;
        spread?: number;
        startVelocity?: number;
        decay?: number;
        gravity?: number;
        drift?: number;
        ticks?: number;
        origin?: { x?: number; y?: number };
        colors?: string[];
        shapes?: ('square' | 'circle')[];
        scalar?: number;
        zIndex?: number;
        disableForReducedMotion?: boolean;
    }

    interface GlobalOptions {
        resize?: boolean;
        useWorker?: boolean;
    }

    type ConfettiFunction = (options?: Options) => Promise<null>;

    interface CreateTypes {
        (options?: GlobalOptions & { canvas?: HTMLCanvasElement }): ConfettiFunction;
        reset: () => void;
    }

    const confetti: ConfettiFunction & {
        create: CreateTypes;
        reset: () => void;
        Options: Options;
    };

    export default confetti;
}
