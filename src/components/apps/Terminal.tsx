import { useState, useRef, useEffect, ReactNode } from 'react';
import { useFileSystem } from '../FileSystemContext';
import { useAppContext } from '../AppContext';
import { AppTemplate } from './AppTemplate';
import { FileIcon } from '../ui/FileIcon';

interface CommandHistory {
  command: string;
  output: (string | ReactNode)[];
  error?: boolean;
}

const PATH = ['/bin', '/usr/bin'];
const BUILTINS = ['cd', 'export', 'alias'];

export interface TerminalProps {
  onLaunchApp?: (appId: string, args: string[]) => void;
}

export function Terminal({ onLaunchApp }: TerminalProps) {
  const { accentColor } = useAppContext();
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const {
    listDirectory,
    getNodeAtPath,
    createFile,
    createDirectory,
    deleteNode,
    readFile,
    resolvePath: contextResolvePath,
    homePath,
    currentUser
  } = useFileSystem();

  // Each Terminal instance has its own working directory (independent windows)
  const [currentPath, setCurrentPath] = useState(homePath);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Use context's resolvePath but with our local currentPath
  const resolvePath = (path: string): string => {
    if (path.startsWith('/')) return contextResolvePath(path);
    if (path === '~') return homePath;
    if (path.startsWith('~/')) return homePath + path.slice(1);

    // Handle relative paths from our local currentPath
    const parts = currentPath.split('/').filter(p => p);
    const pathParts = path.split('/');

    for (const part of pathParts) {
      if (part === '..') {
        parts.pop();
      } else if (part !== '.' && part !== '') {
        parts.push(part);
      }
    }

    return '/' + parts.join('/');
  };

  const getAutocompleteCandidates = (partial: string, isCommand: boolean): string[] => {
    const candidates: string[] = [];

    if (isCommand) {
      // 1. Search Builtins
      candidates.push(...BUILTINS.filter(c => c.startsWith(partial)));

      // 2. Search PATH
      for (const pathDir of PATH) {
        const files = listDirectory(pathDir);
        if (files) {
          files.forEach(f => {
            if (f.name.startsWith(partial) && f.type === 'file') {
              candidates.push(f.name);
            }
          });
        }
      }
    } else {
      // File path completion
      let searchDir = currentPath;
      let searchPrefix = partial;

      const lastSlash = partial.lastIndexOf('/');
      if (lastSlash !== -1) {
        const dirPart = partial.substring(0, lastSlash);
        searchPrefix = partial.substring(lastSlash + 1);
        searchDir = resolvePath(dirPart);
      }

      const files = listDirectory(searchDir);
      if (files) {
        files.forEach(f => {
          if (f.name.startsWith(searchPrefix)) {
            const suffix = f.type === 'directory' ? '/' : '';
            candidates.push(f.name + suffix);
          }
        });
      }
    }

    return Array.from(new Set(candidates)).sort();
  };

  const handleTabCompletion = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (!input) return;

    const parts = input.split(' ');
    const isCommand = parts.length === 1 && !input.endsWith(' ');
    const partial = isCommand ? parts[0] : parts[parts.length - 1];

    const candidates = getAutocompleteCandidates(partial, isCommand);

    if (candidates.length === 0) return;

    if (candidates.length === 1) {
      const completion = candidates[0];
      let newInput = input;

      if (isCommand) {
        newInput = completion + ' ';
      } else {
        const lastSlash = partial.lastIndexOf('/');
        if (lastSlash !== -1) {
          const dirPart = partial.substring(0, lastSlash + 1);
          const completedArg = dirPart + completion;
          parts[parts.length - 1] = completedArg;
          newInput = parts.join(' ');
        } else {
          parts[parts.length - 1] = completion;
          newInput = parts.join(' ');
        }
      }

      setInput(newInput);
    } else {
      setHistory(prev => [
        ...prev,
        { command: input, output: candidates, error: false }
      ]);
    }
  };

  const executeCommand = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) {
      setHistory([...history, { command: '', output: [] }]);
      return;
    }

    const parts = trimmed.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    let output: (string | ReactNode)[] = [];
    let error = false;

    // 1. Check Built-ins
    switch (command) {
      case 'help':
        output = [
          'Available commands:',
          '  ls [path]         - List directory contents',
          '  cd <path>         - Change directory',
          '  pwd               - Print working directory',
          '  cat <file>        - Display file contents',
          '  mkdir <name>      - Create directory',
          '  touch <name>      - Create file',
          '  rm <name>         - Remove file or directory',
          '  echo <text>       - Display text',
          '  whoami            - Print current user',
          '  hostname          - Print system hostname',
          '  clear             - Clear terminal',
          '  help              - Show this help message',
          '  [app]             - Launch installed applications (e.g. Finder)',
          ''
        ];
        break;

      case 'ls': {
        const lsPath = args[0] ? resolvePath(args[0]) : currentPath;
        const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al');
        const longFormat = args.includes('-l') || args.includes('-la') || args.includes('-al');
        const contents = listDirectory(lsPath);
        if (contents) {
          let filteredContents = contents;
          if (!showHidden) {
            filteredContents = contents.filter(node => !node.name.startsWith('.'));
          }
          if (filteredContents.length === 0) {
            output = ['(empty directory)'];
          } else if (longFormat) {
            output = filteredContents.map(node => {
              const perms = node.permissions || (node.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--');
              const owner = node.owner || currentUser;
              const size = node.size?.toString().padStart(6) || '     0';
              const name = node.type === 'directory' ? `\x1b[34m${node.name}\x1b[0m` : node.name;
              return `${perms}  ${owner}  ${size}  ${name}`;
            });
          } else {
            output = filteredContents.map(node => {
              return (
                <div key={node.id} className="flex items-center gap-2">
                  <div className="w-4 h-4 shrink-0 inline-flex items-center justify-center">
                    <FileIcon name={node.name} type={node.type} accentColor={accentColor} />
                  </div>
                  <span>{node.type === 'directory' ? node.name + '/' : node.name}</span>
                </div>
              );
            });
          }
        } else {
          output = [`ls: ${lsPath}: No such file or directory`];
          error = true;
        }
        break;
      }

      case 'cd': {
        if (args.length === 0 || args[0] === '~') {
          setCurrentPath(homePath);
          output = [];
        } else {
          const newPath = resolvePath(args[0]);
          const node = getNodeAtPath(newPath);
          if (node && node.type === 'directory') {
            setCurrentPath(newPath);
            output = [];
          } else {
            output = [`cd: ${args[0]}: No such directory`];
            error = true;
          }
        }
        break;
      }

      case 'pwd':
        output = [currentPath];
        break;

      case 'whoami':
        output = [currentUser];
        break;

      case 'hostname':
        output = ['aurora'];
        break;

      case 'cat': {
        if (args.length === 0) {
          output = ['cat: missing file operand'];
          error = true;
        } else {
          const filePath = resolvePath(args[0]);
          const content = readFile(filePath);
          if (content !== null) {
            output = content.split('\n');
          } else {
            output = [`cat: ${args[0]}: No such file or directory`];
            error = true;
          }
        }
        break;
      }

      case 'mkdir': {
        if (args.length === 0) {
          output = ['mkdir: missing operand'];
          error = true;
        } else {
          const fullPath = resolvePath(args[0]);
          const lastSlashIndex = fullPath.lastIndexOf('/');
          const parentPath = lastSlashIndex === 0 ? '/' : fullPath.substring(0, lastSlashIndex);
          const name = fullPath.substring(lastSlashIndex + 1);

          const success = createDirectory(parentPath, name);
          if (success) {
            output = [];
          } else {
            output = [`mkdir: cannot create directory '${args[0]}'`];
            error = true;
          }
        }
        break;
      }

      case 'touch': {
        if (args.length === 0) {
          output = ['touch: missing file operand'];
          error = true;
        } else {
          const fullPath = resolvePath(args[0]);
          const lastSlashIndex = fullPath.lastIndexOf('/');
          const parentPath = lastSlashIndex === 0 ? '/' : fullPath.substring(0, lastSlashIndex);
          const name = fullPath.substring(lastSlashIndex + 1);

          const success = createFile(parentPath, name, '');
          if (success) {
            output = [];
          } else {
            output = [`touch: cannot create file '${args[0]}'`];
            error = true;
          }
        }
        break;
      }

      case 'rm': {
        if (args.length === 0) {
          output = ['rm: missing operand'];
          error = true;
        } else {
          const targetPath = resolvePath(args[0]);
          const success = deleteNode(targetPath);
          if (success) {
            output = [];
          } else {
            output = [`rm: cannot remove '${args[0]}': No such file or directory`];
            error = true;
          }
        }
        break;
      }

      case 'echo':
        output = [args.join(' ')];
        break;

      case 'clear':
        setHistory([{ command: '', output: [] }]);
        setInput('');
        return;

      default: {
        // Check PATH for executable
        let foundPath: string | null = null;

        // Check if command is a relative or absolute path
        if (command.includes('/')) {
          const resolved = resolvePath(command);
          const node = getNodeAtPath(resolved);
          if (node && node.type === 'file') foundPath = resolved;
        } else {
          // Search PATH
          for (const dir of PATH) {
            // PATH directories are absolute
            // Ensure trailing slash logic isn't messing up
            // dir: /bin. command: ls. -> /bin/ls
            const checkPath = (dir === '/' ? '' : dir) + '/' + command;
            const node = getNodeAtPath(checkPath);
            if (node && node.type === 'file') {
              foundPath = checkPath;
              break;
            }
          }
        }

        if (foundPath) {
          const content = readFile(foundPath);
          if (content && content.startsWith('#!app ')) {
            const appId = content.slice(6).trim();

            // Resolve arguments ? 
            // Currently args are raw strings from split. 
            // For Finder /home/user, arg is /home/user.
            // We might want to resolve it to absolute path to help the app?
            // But 'Finder' app expects 'initialPath'.
            // It's safer to resolve it here IF it looks like a path?
            // Or let App handle data?
            // Let's passed raw args + resolved args?
            // "openWindow" takes simple structure.
            // I'll resolve the first arg IF it exists, just in case.
            const resolvedArgs = args.map(arg => {
              if (arg.startsWith('/') || arg.startsWith('~') || arg.startsWith('.')) {
                return resolvePath(arg);
              }
              return arg;
            });

            onLaunchApp?.(appId, resolvedArgs);
            output = []; // Silent launch
          } else if (content && content.startsWith('#!')) {
            output = [`${command}: script execution not fully supported`];
          } else {
            output = [`${command}: binary file`];
          }
        } else {
          output = [`${command}: command not found`];
          error = true;
        }
      }
    }

    setHistory([...history, { command: trimmed, output, error }]);
    setCommandHistory([...commandHistory, trimmed]);
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      handleTabCompletion(e);
      return;
    }

    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    }
  };

  const getPrompt = () => {
    let displayPath: string;
    if (currentPath === homePath) {
      displayPath = '~';
    } else if (currentPath.startsWith(homePath + '/')) {
      displayPath = '~' + currentPath.slice(homePath.length);
    } else {
      displayPath = currentPath;
    }

    return (
      <span>
        <span style={{ color: accentColor }}>{currentUser}</span>
        <span style={{ color: '#94a3b8' }}>@</span>
        <span style={{ color: accentColor }}>aurora</span>
        <span style={{ color: '#94a3b8' }}>:</span>
        <span style={{ color: '#60a5fa' }}>{displayPath}</span>
        <span style={{ color: accentColor }}>{currentUser === 'root' ? '#' : '$'}</span>
      </span>
    );
  };

  const content = (
    <div
      className="h-full p-4 font-mono text-sm overflow-y-auto"
      ref={terminalRef}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="space-y-2">
        {history.map((entry, index) => (
          <div key={index}>
            {entry.command && (
              <div className="flex gap-2">
                <span className="text-green-400">{getPrompt()}</span>
                <span className="text-white">{entry.command}</span>
              </div>
            )}
            {entry.output.map((line, lineIndex) => (
              <div
                key={lineIndex}
                className={entry.error ? 'text-red-400' : 'text-white/80'}
              >
                {line}
              </div>
            ))}
          </div>
        ))}

        <div className="flex gap-2">
          <span className="text-green-400">{getPrompt()}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white outline-none caret-white"
            autoFocus
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );

  return <AppTemplate content={content} hasSidebar={false} contentClassName="overflow-hidden" />;
}
