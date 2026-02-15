import { useState, useMemo, useEffect } from 'react';
import { IntroSequence } from '@/components/Game/IntroSequence';
import { MainMenu } from '@/components/Game/MainMenu';
import { BootSequence } from '@/components/Game/BootSequence';
import { useFileSystem } from '@/components/FileSystemContext';
import { useAppContext } from '@/components/AppContext';


import { STORAGE_KEYS, memory, hardReset, saveGame } from '@/utils/memory';
import { Onboarding } from "@/components/Game/Onboarding.tsx";

import { StorageIndicator } from '@/components/ui/StorageIndicator';
import { feedback } from '@/services/soundFeedback';

// The "Actual Game" being played is passed as children (The OS Desktop)
interface GameRootProps {
    children: React.ReactNode;
}

type GameState = 'INTRO' | 'MENU' | 'FIRST_BOOT' | 'BOOT' | 'ONBOARDING' | 'GAMEPLAY';

export function GameRoot({ children }: GameRootProps) {
    const [gameState, setGameState] = useState<GameState>('INTRO');
    // Memory is now initialized in main.tsx before render
    const [isMemoryReady] = useState(true);
    
    const { resetFileSystem } = useFileSystem();
    const appContext = useAppContext();
    const { setIsLocked } = appContext;

    // Memory initialization moved to main.tsx for synchronous hydration

    // Global click sound
    useEffect(() => {
        const handleGlobalClick = () => {
            feedback.click();
        };
        window.addEventListener('click', handleGlobalClick);
        return () => window.removeEventListener('click', handleGlobalClick);
    }, []);

    // Signal Electron
    useEffect(() => {
        window.electron?.signalReady?.();
    }, []);

    // Check for save data
    const { onboardingComplete } = appContext;
    const hasSave = useMemo(() => {
        if (!isMemoryReady) return false;
        // Check for FILESYSTEM AND Onboarding Status
        const fsExists = !!memory.getItem(STORAGE_KEYS.FILESYSTEM);
        return fsExists && onboardingComplete;
    }, [onboardingComplete, isMemoryReady]);

    const handleNewGame = async () => {
        // Hard Reset: Wipe OS/HDD + Session (Keep BIOS)
        await hardReset(); 
        
        // Re-init FileSystem Context to defaults (since keys are gone)
        resetFileSystem(true);

        setIsLocked(false);
        setGameState('FIRST_BOOT');
        
        // Force save empty state (Optional but good for immediate persistence)
        await saveGame();
    };

    const handleContinue = () => {
        setIsLocked(true);
        setGameState('BOOT');
    };

    const handleOnboardingAbort = () => {
        setGameState('MENU');
    };

    const handleOnboardingComplete = () => {
        setIsLocked(true);
        setGameState('GAMEPLAY');
    };

    if (!isMemoryReady) {
        return <div className="fixed inset-0 bg-black" />; // Loading state
    }

    return (
        <div className="fixed inset-0 w-full h-full bg-black text-white overflow-hidden">
            <StorageIndicator />
            {(() => {
                switch (gameState) {
                    case 'INTRO':
                        return <IntroSequence onComplete={() => setGameState('MENU')} />;

                    case 'MENU':
                        return (
                            <MainMenu
                                onNewGame={handleNewGame}
                                onContinue={handleContinue}
                                canContinue={hasSave}
                            />
                        );

                    case 'BOOT':
                        return <BootSequence onComplete={() => setGameState('GAMEPLAY')} />;

                    case 'FIRST_BOOT':
                        return <BootSequence onComplete={() => setGameState('ONBOARDING')} />;

                    case 'ONBOARDING':
                        return <Onboarding
                            onContinue={handleOnboardingComplete}
                            onBack={handleOnboardingAbort}
                        />

                    case 'GAMEPLAY':
                        return (
                            <div className="relative w-full h-full">
                                {children}
                            </div>
                        );

                    default:
                        return null;
                }
            })()}
        </div>
    );
}


