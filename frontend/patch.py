import re

with open('/Users/himanshurai/project/placeNxt/smartcareerai/frontend/src/components/recruiter/AIInterviewConfig.tsx', 'r') as f:
    text = f.read()

# We need to fix the syntax error 
bad_content = """                {[
                    { id: "setup", label: "Interview Setup", icon: Zap },
                    { id: "weights", label: "Scoring Criteria", icon: Sliders, badge: !weightsValid ? "!" : undefined },
                    { id: "questions", label: "Questions", icon: MessageSquare, badge: config?.questions?.length },
                    {/* Main scrollable area */ }
                    < div className = "flex-1 overflow-y-auto p-6 md:p-8 min-h-0" >
                    <div className="max-w-4xl mx-auto space-y-12">
                        {/* Tabs */}
                        <div className="flex items-center gap-2 pb-6 border-b border-gray-100 dark:border-white/5">
                            <TabButton id="setup" icon={Zap} label="Interview Setup" />
                            <TabButton id="weights" icon={Sliders} label="Scoring Criteria" />
                            <TabButton id="questions" icon={MessageSquare} label="Questions" disabled={!weightsValid} />
                        </div>"""

good_content = """                {[
                    { id: "setup", label: "Interview Setup", icon: Zap },
                    { id: "weights", label: "Scoring Criteria", icon: Sliders, badge: !weightsValid ? "!" : undefined },
                    { id: "questions", label: "Questions", icon: MessageSquare, badge: config?.questions?.length },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-inner"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                            }`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                        {tab.badge !== undefined && (
                            <span className={`ml-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-black ${tab.badge === "!" ? "bg-rose-500 text-white" : "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                                }`}>
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Main scrollable area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 min-h-0">
                <div className="max-w-4xl mx-auto space-y-12">"""

new_text = text.replace(bad_content, good_content)

with open('/Users/himanshurai/project/placeNxt/smartcareerai/frontend/src/components/recruiter/AIInterviewConfig.tsx', 'w') as f:
    f.write(new_text)

print("Patched fixing syntax error!")
