import { useState, useRef, useEffect, memo } from 'react';
import pkg from '../../package.json';
import { Orbit, Wifi, Battery } from 'lucide-react';
import { useThemeColors } from '../hooks/useThemeColors';
import { useFullscreen } from '../hooks/useFullscreen';
import { CreditsDrawer } from './Credits/CreditsDrawer';
import { cn } from './ui/utils';
import { useAppContext } from './AppContext';
import { useFileSystem } from './FileSystemContext';
import { AudioApplet } from './AudioApplet';
import { NotificationCenter } from './NotificationCenter';
import { hardReset, clearSession } from '../utils/memory';
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
} from './ui/menubar';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

import { getApp } from '../config/appRegistry';

interface MenuBarProps {
  focusedApp?: string | null;
  onOpenApp?: (type: string, data?: any, owner?: string) => void;
}

function MenuBarComponent({ focusedApp, onOpenApp }: MenuBarProps) {
  const { menuBarBackground, blurStyle, getBackgroundColor } = useThemeColors();
  const { devMode, disableShadows, setIsLocked } = useAppContext();
  const { logout, currentUser } = useFileSystem();
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  );

  const [currentDate, setCurrentDate] = useState(() =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  );

  // Hidden Credits Trigger
  const [showCredits, setShowCredits] = useState(false);
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  // Fullscreen management
  const { toggleFullscreen: toggleFullscreenBase } = useFullscreen();

  const handleSystemClick = () => {
    const now = Date.now();
    if (now - lastClickTimeRef.current > 2000) {
      // Reset if too slow
      clickCountRef.current = 0;
    }

    lastClickTimeRef.current = now;
    clickCountRef.current++;

    if (clickCountRef.current >= 6) {
      setShowCredits(true);
      clickCountRef.current = 0;
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }));
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get the menu config for the focused app
  const activeApp = focusedApp ? getApp(focusedApp) : getApp('finder');
  const appConfig = {
    name: activeApp?.name || 'Finder',
    menus: activeApp?.menu?.menus || ['File', 'Edit', 'View', 'Go', 'Window', 'Help'],
    items: activeApp?.menu?.items
  };

  // Add "DEV Center" to Finder menus if devMode is enabled
  const menuLabels = (appConfig.name === 'Finder' && devMode)
    ? [...appConfig.menus, 'DEV Center']
    : appConfig.menus;

  // Render dummy menu content for now, can be expanded to be real later
  const renderMenuContent = (menuName: string) => {
    // 1. Render App-Specific Custom Items
    if (appConfig.items && appConfig.items[menuName]) {
      return (
        <>
          {appConfig.items[menuName].map((item, idx) => {
            if (item.type === 'separator') {
              return <MenubarSeparator key={idx} />;
            }
            return (
              <MenubarItem
                key={idx}
                disabled={item.disabled}
                onClick={() => {
                  if (item.action) {
                    window.dispatchEvent(new CustomEvent('app-menu-action', {
                      detail: {
                        action: item.action,
                        appId: activeApp?.id
                      }
                    }));
                  }
                }}
              >
                {item.label}
                {item.shortcut && <MenubarShortcut>{item.shortcut}</MenubarShortcut>}
              </MenubarItem>
            );
          })}
        </>
      );
    }

    // 2. Default Fallbacks (if no custom items provided for this menu)
    switch (menuName) {
      case 'File':
        return (
          <>
            <MenubarItem>New Window <MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
            <MenubarItem>Close Window <MenubarShortcut>⌘W</MenubarShortcut></MenubarItem>
          </>
        );
      case 'Edit':
        return (
          <>
            <MenubarItem>Undo <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
            <MenubarItem>Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut></MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Cut <MenubarShortcut>⌘X</MenubarShortcut></MenubarItem>
            <MenubarItem>Copy <MenubarShortcut>⌘C</MenubarShortcut></MenubarItem>
            <MenubarItem>Paste <MenubarShortcut>⌘V</MenubarShortcut></MenubarItem>
            <MenubarItem>Select All <MenubarShortcut>⌘A</MenubarShortcut></MenubarItem>
          </>
        );
      case 'View':
        return (
          <>
            <MenubarItem>Reload <MenubarShortcut>⌘R</MenubarShortcut></MenubarItem>
            <MenubarItem onClick={toggleFullscreenBase}>Toggle Fullscreen <MenubarShortcut>F11</MenubarShortcut></MenubarItem>
          </>
        );
      case 'Window':
        return (
          <>
            <MenubarItem>Minimize <MenubarShortcut>⌘M</MenubarShortcut></MenubarItem>
            <MenubarItem>Bring All to Front</MenubarItem>
          </>
        );
      case 'Help':
        return (
          <>
            <MenubarItem>{appConfig.name} Help</MenubarItem>
          </>
        );
      default:
        return (
          <MenubarItem disabled>Feature not implemented</MenubarItem>
        );
    }
  };


  return (
    <div
      className={cn("absolute top-0 left-0 right-0 h-7 border-b border-white/10 flex items-center justify-between px-2 z-[9999]")}
      style={{ background: menuBarBackground, ...blurStyle }}
    >
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <Menubar className="border-none bg-transparent h-auto p-0 space-x-1">
          <MenubarMenu>
            <MenubarTrigger
              className="bg-transparent focus:bg-white/10 data-[state=open]:bg-white/10 px-2 py-0.5 h-7 rounded-sm cursor-default"
              onClick={handleSystemClick}
            >
              <Orbit className="w-4 h-4 text-white/90" />
            </MenubarTrigger>

            {/* Hidden Credits Drawer */}
            <CreditsDrawer isOpen={showCredits} onClose={() => setShowCredits(false)} />

            <MenubarContent
              className={cn("border-white/10 text-white min-w-[14rem] p-1 z-[10000]", !disableShadows ? "shadow-xl" : "shadow-none")}
              style={{ background: getBackgroundColor(0.8), ...blurStyle }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <MenubarItem onClick={() => {
                    // Direct link to About section
                    sessionStorage.setItem('settings-pending-section', 'about');
                    window.dispatchEvent(new CustomEvent('aurora-open-settings-section', { detail: 'about' }));
                    onOpenApp?.('settings');
                  }}>
                    About This Computer...
                  </MenubarItem>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  <p>View system information</p>
                </TooltipContent>
              </Tooltip>
              <MenubarSeparator className="bg-white/10" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <MenubarItem onClick={() => onOpenApp?.('settings')}>
                    System Settings...
                  </MenubarItem>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  <p>View system settings</p>
                </TooltipContent>
              </Tooltip>
              <MenubarItem onClick={() => onOpenApp?.('appstore')}>
                App Store...
              </MenubarItem>
              <MenubarSeparator className="bg-white/10" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <MenubarItem onClick={() => {
                    // Lock Screen -> Overlay LoginScreen but KEEP session
                    setIsLocked(true);
                  }}>
                    Lock Screen
                  </MenubarItem>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  <p>Return to login screen while <b>keeping session</b></p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <MenubarItem onClick={() => {
                    // Switch User -> Logout to suspend, keep storage
                    logout();
                  }}>
                    Switch User
                  </MenubarItem>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  <p>Return to user selection screen while <b>keeping session</b></p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <MenubarItem onClick={() => {
                    // Log Out -> Clear windows session
                    if (currentUser) {
                      clearSession(currentUser);
                    }
                    logout();
                  }}>
                    Log Out: {currentUser ? currentUser : 'User'}
                  </MenubarItem>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  <p>Return to user selection screen while <b>clearing session</b></p>
                </TooltipContent>
              </Tooltip>
              <MenubarSeparator className="bg-white/10" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <MenubarItem
                    onClick={() => {
                      // Hard Reset -> PANIC
                      hardReset();
                      window.location.reload();
                    }}
                    className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                  >
                    <span className="flex-1 text-left">PANIC</span>
                    <Badge variant="destructive" className="ml-auto text-[10px] h-5 px-1.5">Hard Reset</Badge>
                  </MenubarItem>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  <p><b>Warning:</b> This will reset {pkg.build.productName} to factory defaults. Good as a panic button if something goes wrong, too.</p>
                </TooltipContent>
              </Tooltip>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="font-semibold text-xs px-0 data-[state=open]:text-white focus:text-white rounded-sm h-7 items-center flex transition-colors hover:text-white/80">
              {appConfig.name}
            </MenubarTrigger>
            <MenubarContent
              className={cn("border-white/10 text-white min-w-[14rem] p-1 z-[10000]", !disableShadows ? "shadow-xl" : "shadow-none")}
              style={{ background: getBackgroundColor(0.8), ...blurStyle }}
            >
              <MenubarItem>About {appConfig.name}</MenubarItem>
              <MenubarSeparator className="bg-white/10" />
              <MenubarItem>Settings...</MenubarItem>
              <MenubarSeparator className="bg-white/10" />
              <MenubarItem>Quit {appConfig.name}</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {menuLabels.map((menu) => (
            <MenubarMenu key={menu}>
              <MenubarTrigger
                className={cn(
                  "px-0 text-xs h-7 items-center flex transition-colors rounded-sm",
                  "text-white/70 hover:text-white data-[state=open]:text-white focus:text-white"
                )}
                onClick={() => {
                  if (menu === 'DEV Center') {
                    onOpenApp?.('dev-center');
                  }
                }}
              >
                {menu}
              </MenubarTrigger>
              {menu !== 'DEV Center' && (
                <MenubarContent
                  className={cn("border-white/10 text-white min-w-[12rem] p-1 z-[10000]", !disableShadows ? "shadow-xl" : "shadow-none")}
                  style={{ background: getBackgroundColor(0.8), ...blurStyle }}
                >
                  {renderMenuContent(menu)}
                </MenubarContent>
              )}
            </MenubarMenu>
          ))}
        </Menubar>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 px-2">
        <button className="text-white/90 hover:text-white transition-colors">
          <Battery className="w-4 h-4" />
        </button>
        <button className="text-white/90 hover:text-white transition-colors">
          <Wifi className="w-4 h-4" />
        </button>
        <AudioApplet />
        <NotificationCenter />

        <div className="text-white/90 text-xs font-medium flex items-center gap-2">
          <span>{currentDate}</span>
          <span>{currentTime}</span>
        </div>
      </div>
    </div >
  );
}

export const MenuBar = memo(MenuBarComponent);