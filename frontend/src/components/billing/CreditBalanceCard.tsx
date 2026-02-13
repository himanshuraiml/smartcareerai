"use client";

import { CreditCard, Plus } from "lucide-react";

interface CreditBalanceCardProps {
    type: string;
    balance: number;
    icon: any;
    color: string;
    onPurchase: () => void;
}

export default function CreditBalanceCard({
    type,
    balance,
    icon: Icon,
    color,
    onPurchase,
}: CreditBalanceCardProps) {
    return (
        <div className="p-6 rounded-xl glass hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} bg-opacity-20 flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <button
                    onClick={onPurchase}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div>
                <p className="text-3xl font-bold text-white mb-1">{balance === -1 ? '∞' : balance}</p>
                <p className="text-gray-400 text-sm">{type}</p>
            </div>
        </div>
    );
}


