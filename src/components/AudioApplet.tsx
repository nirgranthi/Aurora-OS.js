import { useState, useEffect } from 'react';
import { Volume2, VolumeX, MousePointer2, Bell, AppWindow } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Slider } from './ui/slider';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';
import { soundManager, type SoundCategory } from '../services/sound';
import { useThemeColors } from '../hooks/useThemeColors';
import { useAppContext } from './AppContext';

function useAudioMixer() {
    const [state, setState] = useState({
        master: soundManager.getVolume('master'),
        system: soundManager.getVolume('system'),
        ui: soundManager.getVolume('ui'),
        feedback: soundManager.getVolume('feedback'),
        isMuted: soundManager.getMuted(),
    });

    useEffect(() => {
        const unsubscribe = soundManager.subscribe(() => {
            setState({
                master: soundManager.getVolume('master'),
                system: soundManager.getVolume('system'),
                ui: soundManager.getVolume('ui'),
                feedback: soundManager.getVolume('feedback'),
                isMuted: soundManager.getMuted(),
            });
        });
        return () => { unsubscribe(); };
    }, []);

    return state;
}

export function AudioApplet() {
    const { master, system, ui, feedback, isMuted } = useAudioMixer();
    const { blurStyle, getBackgroundColor } = useThemeColors();
    const { disableShadows, accentColor, reduceMotion } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);

    const handleVolumeChange = (category: SoundCategory, value: number[]) => {
        soundManager.setVolume(category, value[0]);
    };

    const toggleMute = () => {
        soundManager.setMute(!isMuted);
    };

    const sliderClass = "w-full [&_[data-slot=slider-range]]:!bg-[var(--accent-user-override)] [&_[data-slot=slider-thumb]]:!border-[var(--accent-user-override)] [&_[data-slot=slider-track]]:!bg-white/20";


    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    className={`transition-colors ${isOpen ? 'text-white' : 'text-white/70 hover:text-white'}`}
                >
                    {isMuted || master === 0 ? (
                        <VolumeX className="w-4 h-4" />
                    ) : (
                        <Volume2 className="w-4 h-4" />
                    )}
                </button>
            </PopoverTrigger>

            <PopoverContent
                className={`w-80 p-0 overflow-hidden border-white/20 rounded-2xl ${!disableShadows ? 'shadow-2xl' : 'shadow-none'} ${reduceMotion ? '!animate-none !duration-0' : ''}`}
                style={{
                    background: getBackgroundColor(0.8),
                    ...blurStyle,
                    '--accent-user-override': accentColor
                } as React.CSSProperties}
                align="end"
                sideOffset={12}
            >
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-white/70" />
                        <h2 className="text-white/90">Sound</h2>
                    </div>
                    <button
                        onClick={toggleMute}
                        className={`text-xs px-2 py-1 rounded-md transition-colors ${isMuted
                            ? 'bg-red-500/20 text-red-100 hover:bg-red-500/30'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                            }`}
                    >
                        {isMuted ? 'Unmute' : 'Mute All'}
                    </button>
                </div>

                {/* Sliders */}
                <div className="p-4 space-y-6">
                    {/* Master */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-white/90 flex items-center gap-2">
                                <Volume2 className="w-4 h-4 text-white/50" />
                                Master Volume
                            </span>
                            <span className="text-white/50">{Math.round(master * 100)}%</span>
                        </div>
                        <Slider
                            value={[master]}
                            max={1}
                            step={0.01}
                            onValueChange={(val) => handleVolumeChange('master', val)}
                            className={sliderClass}
                        />
                    </div>

                    <Accordion type="single" collapsible className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                        <AccordionItem value="sound-mixer" className="border-none">
                            <AccordionTrigger className="w-full !px-6 py-4 text-white/70">
                                <h2 className="text-white/90">Mixer</h2>
                            </AccordionTrigger>
                            <AccordionContent className="!px-6 pb-6 pt-3">
                                <div className="space-y-6">
                                    {/* System */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-white/90 flex items-center gap-2">
                                                <Bell className="w-4 h-4 text-white/50" />
                                                System Alerts
                                            </span>
                                            <span className="text-white/50">{Math.round(system * 100)}%</span>
                                        </div>
                                        <Slider
                                            value={[system]}
                                            max={1}
                                            step={0.01}
                                            onValueChange={(val) => handleVolumeChange('system', val)}
                                            className={sliderClass}
                                        />
                                    </div>

                                    {/* UI Sounds */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-white/90 flex items-center gap-2">
                                                <AppWindow className="w-4 h-4 text-white/50" />
                                                Interface
                                            </span>
                                            <span className="text-white/50">{Math.round(ui * 100)}%</span>
                                        </div>
                                        <Slider
                                            value={[ui]}
                                            max={1}
                                            step={0.01}
                                            onValueChange={(val) => handleVolumeChange('ui', val)}
                                            className={sliderClass}
                                        />
                                    </div>

                                    {/* Feedback */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-white/90 flex items-center gap-2">
                                                <MousePointer2 className="w-4 h-4 text-white/50" />
                                                Input Feedback
                                            </span>
                                            <span className="text-white/50">{Math.round(feedback * 100)}%</span>
                                        </div>
                                        <Slider
                                            value={[feedback]}
                                            max={1}
                                            step={0.01}
                                            onValueChange={(val) => handleVolumeChange('feedback', val)}
                                            className={sliderClass}
                                        />
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </PopoverContent>
        </Popover>
    );
}
