import { useState, useEffect } from 'react';
import { Clock, RotateCcw, Save, Megaphone, Trash2, StopCircle, PlayCircle, Plus, CloudDownload } from 'lucide-react';
import { useServerStore } from '../stores/serverStore';
import { getSchedules, createSchedule, deleteSchedule, toggleSchedule, Schedule } from '../utils/tauri';
import { cn } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Automation({ serverId }: { serverId?: number }) {
    const { servers } = useServerStore();
    const [internalServerId, setInternalServerId] = useState<number | null>(null);
    const selectedServerId = serverId || internalServerId;
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [taskType, setTaskType] = useState<'restart' | 'backup' | 'broadcast' | 'update'>('restart');
    const [timingType, setTimingType] = useState<'daily' | 'interval'>('daily');
    const [timeValue, setTimeValue] = useState('04:00'); // HH:MM
    const [intervalValue, setIntervalValue] = useState('6'); // Hours
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (selectedServerId) {
            loadSchedules();
        } else {
            setSchedules([]);
        }
    }, [selectedServerId]);

    const loadSchedules = async () => {
        if (!selectedServerId) return;
        try {
            const data = await getSchedules(selectedServerId);
            setSchedules(data);
        } catch (error) {
            toast.error('Failed to load schedules');
            console.error(error);
        }
    };

    const handleCreate = async () => {
        if (!selectedServerId) return;

        let cron = '';
        if (timingType === 'daily') {
            const [h, m] = timeValue.split(':');
            // Seconds Minutes Hours DayOfMonth Month DayOfWeek Year
            cron = `0 ${Number(m)} ${Number(h)} * * * *`;
        } else {
            cron = `0 0 */${intervalValue} * * * *`;
        }

        const payload = taskType === 'broadcast' ? message : undefined;

        try {
            await createSchedule(selectedServerId, taskType, cron, payload);
            toast.success('Schedule created');
            setIsCreating(false);
            loadSchedules();
        } catch (error) {
            toast.error(`Failed to create schedule: ${error}`);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;
        try {
            await deleteSchedule(id);
            toast.success('Schedule deleted');
            loadSchedules();
        } catch (error) {
            toast.error('Failed to delete schedule');
        }
    };

    const handleToggle = async (id: number, current: boolean) => {
        try {
            await toggleSchedule(id, !current);
            loadSchedules(); // Refresh to see update
        } catch (error) {
            toast.error('Failed to toggle schedule');
        }
    };

    const getCronDescription = (cron: string) => {
        // Very basic parser for display
        const parts = cron.split(' ');
        if (parts.length >= 3) {
            if (parts[2].startsWith('*/')) {
                return `Every ${parts[2].substring(2)} Hours`;
            } else if (parts[2] !== '*' && parts[1] !== '*') {
                return `Daily at ${parts[2].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
            }
        }
        return cron;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            {!serverId && (
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">
                            Automation
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg">Scheduled Tasks & Maintenance</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <span className="text-slate-400 text-sm">Target Server:</span>
                        <select
                            value={selectedServerId || ''}
                            onChange={(e) => setInternalServerId(Number(e.target.value))}
                            className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 min-w-[200px]"
                        >
                            <option value="">Select Server...</option>
                            {servers.map(server => (
                                <option key={server.id} value={server.id}>{server.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {!selectedServerId ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                    <Clock className="w-16 h-16 mb-4 opacity-50" />
                    <p>Select a server to manage automation tasks</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {!isCreating ? (
                        <>
                            {schedules.length === 0 ? (
                                <div className="text-center py-12 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                                    <p className="text-slate-400 mb-4">No scheduled tasks found</p>
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors font-medium inline-flex items-center space-x-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Create First Task</span>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {schedules.map(schedule => (
                                        <div key={schedule.id} className="glass-panel p-6 rounded-xl flex items-center justify-between group hover:border-violet-500/30 transition-all">
                                            <div className="flex items-center space-x-4">
                                                <div className={cn("p-3 rounded-lg",
                                                    schedule.taskType === 'restart' ? "bg-orange-500/10 text-orange-400" :
                                                        schedule.taskType === 'backup' ? "bg-emerald-500/10 text-emerald-400" :
                                                            schedule.taskType === 'update' ? "bg-sky-500/10 text-sky-400" :
                                                                "bg-blue-500/10 text-blue-400"
                                                )}>
                                                    {schedule.taskType === 'restart' && <RotateCcw className="w-6 h-6" />}
                                                    {schedule.taskType === 'backup' && <Save className="w-6 h-6" />}
                                                    {schedule.taskType === 'update' && <CloudDownload className="w-6 h-6" />}
                                                    {schedule.taskType === 'broadcast' && <Megaphone className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white capitalize">{schedule.taskType}</h3>
                                                    <div className="flex items-center space-x-2 text-sm text-slate-400">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{getCronDescription(schedule.cronExpression)}</span>
                                                        {schedule.payload && <span className="text-slate-500">• "{schedule.payload}"</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-4">
                                                <div className="text-right mr-4 hidden md:block">
                                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Last Run</div>
                                                    <div className="text-sm text-slate-300">{schedule.lastRun ? new Date(schedule.lastRun + 'Z').toLocaleString() : 'Never'}</div>
                                                </div>

                                                <button
                                                    onClick={() => handleToggle(schedule.id, schedule.enabled)}
                                                    className={cn("p-2 rounded-lg transition-colors", schedule.enabled ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20" : "text-slate-400 bg-slate-700/50 hover:bg-slate-700")}
                                                    title={schedule.enabled ? "Disable" : "Enable"}
                                                >
                                                    {schedule.enabled ? <StopCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(schedule.id)}
                                                    className="p-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-white hover:border-slate-500 transition-all flex items-center justify-center space-x-2"
                                    >
                                        <Plus className="w-5 h-5" />
                                        <span>Add Another Schedule</span>
                                    </button>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="glass-panel p-6 rounded-xl border border-violet-500/30 animate-in slide-in-from-bottom-4">
                            <h3 className="text-xl font-bold text-white mb-6">New Scheduled Task</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                {/* Task Type */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Task Type</label>
                                    <div className="grid grid-cols-2 gap-2 bg-slate-900/50 p-1 rounded-lg">
                                        {(['restart', 'backup', 'update', 'broadcast'] as const).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setTaskType(type)}
                                                className={cn("py-2 rounded px-2 text-sm capitalize transition-all", taskType === type ? "bg-violet-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Frequency */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Frequency</label>
                                    <div className="grid grid-cols-2 gap-2 bg-slate-900/50 p-1 rounded-lg">
                                        <button
                                            onClick={() => setTimingType('daily')}
                                            className={cn("py-2 rounded px-2 text-sm transition-all", timingType === 'daily' ? "bg-violet-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                                        >
                                            Daily
                                        </button>
                                        <button
                                            onClick={() => setTimingType('interval')}
                                            className={cn("py-2 rounded px-2 text-sm transition-all", timingType === 'interval' ? "bg-violet-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                                        >
                                            Interval
                                        </button>
                                    </div>
                                </div>

                                {/* Time/Interval Settings */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">
                                        {timingType === 'daily' ? 'Time (24h)' : 'Every X Hours'}
                                    </label>
                                    {timingType === 'daily' ? (
                                        <input
                                            type="time"
                                            value={timeValue}
                                            onChange={(e) => setTimeValue(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                    ) : (
                                        <select
                                            value={intervalValue}
                                            onChange={(e) => setIntervalValue(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        >
                                            {[1, 2, 3, 4, 6, 8, 12, 24].map(num => (
                                                <option key={num} value={num.toString()}>{num} Hours</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            {taskType === 'broadcast' && (
                                <div className="mb-6 space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Message to Broadcast</label>
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="e.g., Server restarting in 15 minutes!"
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>
                            )}

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-violet-500/20"
                                >
                                    Create Schedule
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
