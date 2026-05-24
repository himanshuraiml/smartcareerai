import { BrainCircuit } from 'lucide-react';

interface Props {
    className?: string;
}

export default function AIDisclaimer({ className = '' }: Props) {
    return (
        <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 text-amber-700 dark:text-amber-400 ${className}`}>
            <BrainCircuit className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
                <span className="font-semibold">AI-generated results.</span>{' '}
                Scores, feedback, and suggestions are produced by AI and may not always be 100% accurate.
                Use them as guidance, not a guarantee.
            </p>
        </div>
    );
}
