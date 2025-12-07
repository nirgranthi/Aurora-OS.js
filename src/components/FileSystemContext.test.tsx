import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileSystemProvider, useFileSystem } from './FileSystemContext';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('FileSystemContext', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FileSystemProvider>{children}</FileSystemProvider>
    );

    it('resolves home path ~', () => {
        const { result } = renderHook(() => useFileSystem(), { wrapper });
        expect(result.current.resolvePath('~')).toBe('/home/user');
        expect(result.current.resolvePath('~/Desktop')).toBe('/home/user/Desktop');
    });

    it('resolves absolute path aliases (/Desktop -> ~/Desktop)', () => {
        const { result } = renderHook(() => useFileSystem(), { wrapper });

        // Test the newly added aliases
        expect(result.current.resolvePath('/Desktop')).toBe('/home/user/Desktop');
        expect(result.current.resolvePath('/Documents')).toBe('/home/user/Documents');
        expect(result.current.resolvePath('/Downloads')).toBe('/home/user/Downloads');

        // Subdirectories
        expect(result.current.resolvePath('/Desktop/test.txt')).toBe('/home/user/Desktop/test.txt');
    });

    it('preserves system paths', () => {
        const { result } = renderHook(() => useFileSystem(), { wrapper });
        expect(result.current.resolvePath('/bin')).toBe('/bin');
        expect(result.current.resolvePath('/usr/bin')).toBe('/usr/bin');
        expect(result.current.resolvePath('/etc')).toBe('/etc');
    });

    it('handles relative paths', () => {
        const { result } = renderHook(() => useFileSystem(), { wrapper });
        // Default cwd is ~ (/home/user)
        expect(result.current.resolvePath('test.txt')).toBe('/home/user/test.txt');

        // Change cwd
        act(() => {
            result.current.setCurrentPath('/bin');
        });
        expect(result.current.resolvePath('ls')).toBe('/bin/ls');
    });

    it('enforces unique filenames', () => {
        const { result } = renderHook(() => useFileSystem(), { wrapper });
        const path = '/home/user/Desktop';

        // Create first file
        let success = false;
        act(() => {
            success = result.current.createFile(path, 'test.txt');
        });
        expect(success).toBe(true);

        // Try creating duplicate
        act(() => {
            success = result.current.createFile(path, 'test.txt');
        });
        expect(success).toBe(false);
    });
});
