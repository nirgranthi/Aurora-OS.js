import { Mail, Calendar, LucideIcon, FileQuestion } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { EmptyState } from '../ui/empty-state';

interface PlaceholderAppProps {
    title: string;
}

const APP_ICONS: Record<string, LucideIcon> = {
    'Mail': Mail,
    'Calendar': Calendar
};

const APP_DESCRIPTIONS: Record<string, string> = {
    'Mail': 'Manage your emails, contacts, and calendar events.',
    'Calendar': 'Schedule meetings, events, and reminders.'
};

export function PlaceholderApp({ title }: PlaceholderAppProps) {
    const { blurStyle } = useThemeColors();
    const Icon = APP_ICONS[title] || FileQuestion;
    const description = APP_DESCRIPTIONS[title] || 'This application is currently under development.';

    return (
        <div
            className="h-full flex flex-col items-center justify-center bg-black/40"
            style={{
                ...blurStyle
            }}
        >
            <EmptyState
                icon={Icon}
                title={`${title} is Coming Soon`}
                description={description}
            />
        </div>
    );
}
