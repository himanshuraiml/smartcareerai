"use client";

import { useState, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/providers/ThemeProvider";
import { generateId, safeEffectStateUpdate } from "@/lib/purity-helpers";
import {
    Binary, Brain, Code2, Users, MessageSquare,
    GripVertical, Trash2, Settings2, Plus, ArrowRight,
    HelpCircle, Zap, ShieldCheck, Cpu, GripHorizontal
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type StageType = 'ANALYTICAL' | 'BEHAVIOURAL' | 'CODING' | 'TECHNICAL' | 'HR' | 'AI_INTERVIEW';

export interface PipelineStep {
    id: string; // Internal id for workflow array
    libraryId?: string; // Reference to the original stage type in the library
    type: StageType;
    label: string;
    description: string;
    icon: any;
    color: string;
    configId?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    isAiLed?: boolean;
    config?: {
        duration?: number;
        questionCount?: number;
        difficultyDistribution?: Record<string, number>;
        requiredSkills?: string[];
        challengeIds?: string[];
        deadlineDays?: number;       // days from job posting; for all stage types
        assessmentDeadline?: string; // ISO date; for ANALYTICAL and BEHAVIOURAL stages
        cutoffScore?: number;        // Passing criteria (0-100)
    };
}

interface Props {
    initialSteps?: PipelineStep[];
    onChange: (steps: PipelineStep[]) => void;
    onConfigure?: (stepId: string, type: StageType) => void;
}

const STAGE_LIBRARY: (Omit<PipelineStep, 'id'> & { libraryId: string })[] = [
    {
        libraryId: 'lib-analytical',
        type: 'ANALYTICAL',
        label: 'Analytical Test',
        description: 'Aptitude, logic & reasoning MCQs',
        icon: Cpu,
        color: 'indigo',
        isAiLed: true
    },
    {
        libraryId: 'lib-behavioural',
        type: 'BEHAVIOURAL',
        label: 'Behavioural Test',
        description: 'AI-led personality & soft skills assessment',
        icon: Brain,
        color: 'purple',
        isAiLed: true
    },
    {
        libraryId: 'lib-ai-interview',
        type: 'AI_INTERVIEW',
        label: 'AI Interview',
        description: 'AI-led technical or HR interview',
        icon: MessageSquare,
        color: 'cyan',
        isAiLed: true
    },
    {
        libraryId: 'lib-coding',
        type: 'CODING',
        label: 'Coding Test',
        description: 'Hands-on programming challenges',
        icon: Code2,
        color: 'emerald',
        isAiLed: false
    },
    {
        libraryId: 'lib-technical',
        type: 'TECHNICAL',
        label: 'Technical Interview',
        description: 'Manual deep-dive into domain expertise',
        icon: Binary,
        color: 'blue',
        isAiLed: false
    },
    {
        libraryId: 'lib-hr',
        type: 'HR',
        label: 'HR Interview',
        description: 'Manual culture fit & salary expectations',
        icon: Users,
        color: 'rose',
        isAiLed: false
    },
];

const COLOR_MAP: Record<string, string> = {
    indigo: "border-indigo-100 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    purple: "border-purple-100 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
    emerald: "border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    blue: "border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    rose: "border-rose-100 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
    cyan: "border-cyan-100 dark:border-cyan-500/20 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
};

const WorkflowDeadlineInput = ({ defaultValue, onChange }: { defaultValue: string; onChange: (val: string | undefined) => void }) => {
    const [minDate, setMinDate] = useState("");
    useEffect(() => {
        safeEffectStateUpdate(() => {
            setMinDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        });
    }, []);
    return (
        <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Assessment Deadline <span className="normal-case font-normal text-[#475569]">(optional)</span></label>
            <input
                type="date"
                min={minDate}
                defaultValue={defaultValue}
                onChange={(e) => onChange(e.target.value || undefined)}
                className="w-full bg-[#1A1D24] border border-[#2A2E39] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#3B82F6] transition-all [color-scheme:dark]"
            />
            <p className="text-[11px] text-[#475569]">Candidates must complete this test by this date.</p>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function WorkflowBuilder({ initialSteps = [], onChange, onConfigure }: Props) {
    const getSafeSteps = (steps: any) => Array.isArray(steps) ? steps.filter(Boolean) : [];
    const [pipeline, setPipeline] = useState<PipelineStep[]>(getSafeSteps(initialSteps));
    const [selectedStage, setSelectedStage] = useState<PipelineStep | null>(null);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    // Sync external props back to pipeline if needed
    useEffect(() => {
        safeEffectStateUpdate(() => setPipeline(getSafeSteps(initialSteps)));
    }, [initialSteps]);

    const handleToggleStage = (libraryStage: typeof STAGE_LIBRARY[0]) => {
        // Check if the stage is already in the pipeline
        const existingIndex = pipeline.findIndex(s => s?.libraryId === libraryStage.libraryId);

        const newPipeline = Array.from(pipeline);
        if (existingIndex >= 0) {
            // Remove it
            newPipeline.splice(existingIndex, 1);
        } else {
            // Add it at the end
            newPipeline.push({
                ...libraryStage,
                id: generateId(libraryStage.type), // unique ID for drag-drop
                libraryId: libraryStage.libraryId,
            });
        }

        setPipeline(newPipeline);
        onChange(newPipeline);
    };

    const isStageEnabled = (libraryId: string) => {
        return pipeline.some(s => s?.libraryId === libraryId);
    };

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return;

        // Clone current pipeline
        const newPipeline = Array.from(pipeline);

        if (source.droppableId === 'pipeline' && destination.droppableId === 'pipeline') {
            // Reordering within pipeline
            const [reorderedItem] = newPipeline.splice(source.index, 1);
            newPipeline.splice(destination.index, 0, reorderedItem);
        }

        setPipeline(newPipeline);
        onChange(newPipeline);
    };

    const toggleAiForStage = (id: string) => {
        const newPipeline = pipeline.map(stage => {
            if (stage.id === id) {
                const isNowAi = !stage.isAiLed;
                const baseLabel = stage.label.replace('Manual ', '').replace('AI ', '');
                return {
                    ...stage,
                    isAiLed: isNowAi,
                    type: isNowAi && (stage.type === 'TECHNICAL' || stage.type === 'HR') ? 'AI_INTERVIEW' : stage.type,
                    label: isNowAi ? `AI ${baseLabel}` : `Manual ${baseLabel}`,
                    description: isNowAi ? `AI-led version of ${baseLabel}` : `Manual version of ${baseLabel}`,
                    color: isNowAi ? 'cyan' : (stage.type === 'TECHNICAL' ? 'blue' : 'rose')
                };
            }
            return stage;
        });
        setPipeline(newPipeline);
        onChange(newPipeline);
    };

    const updateStageConfig = (id: string, config: any) => {
        const newPipeline = pipeline.map(stage => {
            if (stage.id === id) {
                return { ...stage, config: { ...stage.config, ...config } };
            }
            return stage;
        });
        setPipeline(newPipeline);
        onChange(newPipeline);
    };

    const removeStage = (id: string) => {
        const newPipeline = pipeline.filter(s => s.id !== id);
        setPipeline(newPipeline);
        onChange(newPipeline);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row gap-8 min-h-[500px]">

                {/* ───────────────────────────────────────────────────────── */}
                {/* Left Column: Stage Selector (Toggle Switches)             */}
                {/* ───────────────────────────────────────────────────────── */}
                <div className="lg:w-1/2 space-y-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-[#3B82F6]" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Available Stages</h3>
                    </div>

                    <div className="space-y-3 flex-1">
                        {STAGE_LIBRARY.map((stage) => {
                            const enabled = isStageEnabled(stage.libraryId);

                            return (
                                <div
                                    key={stage.libraryId}
                                    className={`relative flex items-center justify-between p-4 rounded-3xl border transition-all duration-300 ${enabled
                                        ? 'bg-[#151821] border-[#3B82F6]/30 shadow-[0_4px_12px_rgba(0,0,0,0.2)]'
                                        : 'bg-[#0E1117] border-[#1E293B] hover:border-[#2A2E39]'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Drag Indicator (Visual only, to match reference design feeling) */}
                                        <div className="grid grid-cols-2 gap-[3px] text-[#475569] opacity-50">
                                            <div className="w-1.5 h-1.5 rounded-sm bg-current"></div>
                                            <div className="w-1.5 h-1.5 rounded-sm bg-current"></div>
                                            <div className="w-1.5 h-1.5 rounded-sm bg-current"></div>
                                            <div className="w-1.5 h-1.5 rounded-sm bg-current"></div>
                                            <div className="w-1.5 h-1.5 rounded-sm bg-current"></div>
                                            <div className="w-1.5 h-1.5 rounded-sm bg-current"></div>
                                        </div>

                                        <div>
                                            <h4 className={`text-base font-bold transition-colors ${enabled ? 'text-white' : 'text-gray-400'}`}>
                                                {stage.label}
                                            </h4>
                                            <p className={`text-sm mt-0.5 transition-colors ${enabled ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                                                {enabled ? stage.description : 'Currently disabled stage'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Toggle Switch */}
                                    <button
                                        type="button"
                                        onClick={() => handleToggleStage(stage)}
                                        className={`w-12 h-6 rounded-full relative transition-colors focus:outline-none flex-shrink-0 ${enabled ? 'bg-[#3B82F6]' : 'bg-[#1E293B]'
                                            }`}
                                    >
                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-0.5 bg-gray-400'
                                            }`} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden lg:block w-[1px] bg-[#1E293B] self-stretch mx-2" />

                {/* ───────────────────────────────────────────────────────── */}
                {/* Right Column: Visual Pipeline Builder                     */}
                {/* ───────────────────────────────────────────────────────── */}
                <div className="lg:w-1/2 flex flex-col h-full space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#3B82F6]" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Visual Pipeline</h3>
                        </div>
                        <span className="text-xs font-bold text-[#94A3B8] bg-[#1E293B] px-3 py-1 rounded-full">
                            {pipeline.length} Stage{pipeline.length !== 1 ? 's' : ''} Active
                        </span>
                    </div>

                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="pipeline" direction="vertical">
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`flex-1 rounded-3xl min-h-[400px] border-2 border-dashed transition-all p-6 space-y-4 ${snapshot.isDraggingOver
                                        ? 'border-[#3B82F6]/50 bg-[#3B82F6]/5'
                                        : 'border-[#1E293B] bg-[#0E1117]/50'
                                        }`}
                                >
                                    <AnimatePresence>
                                        {pipeline.length === 0 && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex flex-col items-center justify-center h-full min-h-[300px] text-center"
                                            >
                                                <div className="w-16 h-16 rounded-full bg-[#1A1D24] border border-[#2A2E39] flex items-center justify-center mb-4 text-[#475569]">
                                                    <GripHorizontal className="w-6 h-6" />
                                                </div>
                                                <h4 className="text-gray-300 font-bold mb-1">Your workflow is empty</h4>
                                                <p className="text-sm font-medium text-[#475569] max-w-[250px]">
                                                    Toggle stages on the left to add them to your interactive pipeline sequence.
                                                </p>
                                            </motion.div>
                                        )}
                                        {pipeline.map((stage, index) => (
                                            <Draggable key={stage.id} draggableId={stage.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <motion.div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className={`flex items-center gap-4 p-5 rounded-2xl bg-[#151821] border ${snapshot.isDragging
                                                            ? 'shadow-2xl border-[#3B82F6] scale-105 z-50'
                                                            : 'hover:border-[#3B82F6]/30 border-[#2A2E39] shadow-sm relative group'
                                                            }`}
                                                    >
                                                        {/* Step Connector Line */}
                                                        {index < pipeline.length - 1 && !snapshot.isDragging && (
                                                            <div className="absolute top-full left-[2.3rem] w-[2px] h-4 bg-[#2A2E39] -z-10" />
                                                        )}

                                                        <div {...provided.dragHandleProps} className="text-[#475569] hover:text-[#94A3B8] cursor-grab active:cursor-grabbing p-1">
                                                            <GripVertical className="w-5 h-5" />
                                                        </div>

                                                        <div className={`p-2.5 rounded-xl ${COLOR_MAP[stage.color]} flex-shrink-0 shadow-inner`}>
                                                            <stage.icon className="w-5 h-5" />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#1E293B] text-white text-[10px] font-black tracking-tighter">
                                                                    {index + 1}
                                                                </span>
                                                                <h4 className="font-bold text-white text-sm truncate">{stage.label}</h4>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1">
                                                                    <ArrowRight className="w-3 h-3" /> Auto-advance
                                                                </span>
                                                                {stage.config?.deadlineDays && (
                                                                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                                                                        ⏳ {stage.config.deadlineDays}d
                                                                    </span>
                                                                )}
                                                                {stage.config?.assessmentDeadline && (
                                                                    <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded-full">
                                                                        Due {new Date(stage.config.assessmentDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => {
                                                                    if (onConfigure && (stage.type === 'CODING' || stage.type === 'AI_INTERVIEW')) {
                                                                        onConfigure(stage.id, stage.type);
                                                                    } else {
                                                                        setSelectedStage(stage);
                                                                        setIsConfigModalOpen(true);
                                                                    }
                                                                }}
                                                                className="p-2 rounded-lg text-[#94A3B8] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-all"
                                                                title="Configure Stage"
                                                            >
                                                                <Settings2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    removeStage(stage.id);
                                                                }}
                                                                className="p-2 rounded-lg text-[#94A3B8] hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                                                title="Remove Stage"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </Draggable>
                                        ))}
                                    </AnimatePresence>
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            </div>

            {/* Config Modal */}
            <AnimatePresence>
                {isConfigModalOpen && selectedStage && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0E1117]/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[#151821] rounded-3xl w-full max-w-lg shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-[#2A2E39] overflow-hidden"
                        >
                            <div className="p-6 border-b border-[#2A2E39] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${COLOR_MAP[selectedStage.color]}`}>
                                        <selectedStage.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-white text-lg">Configure {selectedStage.label}</h3>
                                </div>
                                <button
                                    onClick={() => setIsConfigModalOpen(false)}
                                    className="p-2 hover:bg-[#1E293B] rounded-full transition-all text-[#94A3B8] hover:text-white"
                                >
                                    <Plus className="w-5 h-5 rotate-45" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* AI Interview Toggle */}
                                {['TECHNICAL', 'HR', 'AI_INTERVIEW'].includes(selectedStage.type) && (
                                    <div className="flex items-center justify-between p-5 rounded-2xl bg-[#0F172A] border border-[#1E3A8A]">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 rounded-full bg-[#3B82F6]/10 text-[#3B82F6]">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">AI-Led Interview</h4>
                                                <p className="text-xs text-[#94A3B8] mt-0.5">Replace manual session with AI agent</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleAiForStage(selectedStage.id)}
                                            className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none ${selectedStage.isAiLed ? 'bg-[#3B82F6]' : 'bg-[#1E293B]'}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${selectedStage.isAiLed ? 'translate-x-7' : 'translate-x-1'}`}
                                            />
                                        </button>
                                    </div>
                                )}

                                {/* Assessment Config (Duration/Questions) */}
                                {['ANALYTICAL', 'BEHAVIOURAL', 'CODING'].includes(selectedStage.type) && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Duration (Mins)</label>
                                                <input
                                                    type="number"
                                                    defaultValue={selectedStage.config?.duration || 30}
                                                    onChange={(e) => updateStageConfig(selectedStage.id, { duration: parseInt(e.target.value) })}
                                                    className="w-full bg-[#1A1D24] border border-[#2A2E39] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#3B82F6] transition-all font-medium"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Questions</label>
                                                <input
                                                    type="number"
                                                    defaultValue={selectedStage.config?.questionCount || 20}
                                                    onChange={(e) => updateStageConfig(selectedStage.id, { questionCount: parseInt(e.target.value) })}
                                                    className="w-full bg-[#1A1D24] border border-[#2A2E39] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#3B82F6] transition-all font-medium"
                                                />
                                            </div>
                                        </div>

                                        {/* Assessment Deadline (ANALYTICAL / BEHAVIOURAL only) */}
                                        {['ANALYTICAL', 'BEHAVIOURAL'].includes(selectedStage.type) && (
                                            <WorkflowDeadlineInput
                                                defaultValue={selectedStage.config?.assessmentDeadline || ''}
                                                onChange={(val) => updateStageConfig(selectedStage.id, { assessmentDeadline: val })}
                                            />
                                        )}
                                        {/* Cutoff Score (for Assessment & Interview stages) */}
                                        {['ANALYTICAL', 'BEHAVIOURAL', 'CODING', 'TECHNICAL', 'HR', 'AI_INTERVIEW'].includes(selectedStage.type) && (
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Passing Cutoff (%) <span className="normal-case font-normal text-[#475569]">(0-100, optional)</span></label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        placeholder="e.g. 70"
                                                        defaultValue={selectedStage.config?.cutoffScore || ''}
                                                        onChange={(e) => updateStageConfig(selectedStage.id, { cutoffScore: e.target.value ? parseInt(e.target.value) : undefined })}
                                                        className="w-full bg-[#1A1D24] border border-[#2A2E39] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#3B82F6] transition-all font-medium placeholder:text-[#475569]"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none font-bold text-xs">%</div>
                                                </div>
                                                <p className="text-[11px] text-[#475569]">Candidates will see this as the required passing mark.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Stage Deadline (days from posting) — all stage types */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Stage Deadline <span className="normal-case font-normal text-[#475569]">(days from posting, optional)</span></label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={60}
                                        placeholder="e.g. 7"
                                        defaultValue={selectedStage.config?.deadlineDays || ''}
                                        onChange={(e) => updateStageConfig(selectedStage.id, { deadlineDays: e.target.value ? parseInt(e.target.value) : undefined })}
                                        className="w-full bg-[#1A1D24] border border-[#2A2E39] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#3B82F6] transition-all font-medium placeholder:text-[#475569]"
                                    />
                                    <p className="text-[11px] text-[#475569]">Informational: shown on candidate cards as a target completion window.</p>
                                </div>

                                <div className="pt-6 border-t border-[#2A2E39]">
                                    <button
                                        onClick={() => setIsConfigModalOpen(false)}
                                        className="w-full bg-[#3B82F6] hover:bg-blue-500 text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                                    >
                                        Save Configuration
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
