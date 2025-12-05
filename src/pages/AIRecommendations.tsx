import { useState } from 'react';
import { Sparkles, Check } from 'lucide-react';

const GAME_MODES = [
    { id: 'pve', name: 'PvE (Player vs Environment)', icon: '🌲' },
    { id: 'pvp', name: 'PvP (Player vs Player)', icon: '⚔️' },
    { id: 'rp', name: 'Roleplay', icon: '🎭' },
    { id: 'hardcore', name: 'Hardcore', icon: '💀' },
    { id: 'beginner', name: 'Beginner Friendly', icon: '🌟' },
];

const RECOMMENDATIONS = {
    pve: [
        { setting: 'XP Multiplier', value: '2x', reason: 'Faster progression for casual players' },
        { setting: 'Taming Speed', value: '3x', reason: 'Reduced taming time' },
        { setting: 'Harvest Amount', value: '2x', reason: 'More resources per gather' },
        { setting: 'PvP', value: 'Disabled', reason: 'No player combat' },
    ],
};

export default function AIRecommendations() {
    const [selectedMode, setSelectedMode] = useState('pve');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">AI Recommendations</h1>
                <p className="text-dark-400 mt-1">Get intelligent setting suggestions for your server</p>
            </div>

            {/* Game Mode Selection */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Select Game Mode</h2>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {GAME_MODES.map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => setSelectedMode(mode.id)}
                            className={`p-6 border-2 rounded-xl transition-all ${selectedMode === mode.id
                                ? 'border-primary-600 bg-primary-600/10'
                                : 'border-dark-800 hover:border-dark-700'
                                }`}
                        >
                            <div className="text-4xl mb-2">{mode.icon}</div>
                            <div className="text-sm font-medium text-white">{mode.name}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-dark-900 border border-dark-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-primary-500" />
                        <span>Recommended Settings</span>
                    </h2>
                    <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                        Apply All
                    </button>
                </div>

                {RECOMMENDATIONS.pve.map((rec, index) => (
                    <div key={index} className="flex items-start justify-between p-4 bg-dark-800 rounded-lg">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-white">{rec.setting}</h3>
                                <span className="px-2 py-1 bg-primary-600/20 text-primary-400 text-sm rounded-full">
                                    {rec.value}
                                </span>
                            </div>
                            <p className="text-sm text-dark-400 mt-1">{rec.reason}</p>
                        </div>
                        <button className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors">
                            <Check className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
