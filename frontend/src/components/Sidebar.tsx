'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Mic, BookOpen,
  Award, Sparkles, BookOpenText,
  Volume2, PenTool, Briefcase, Users, Speech,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

const menuItems = [
  { name: 'Dashboard',          path: '/dashboard',                   icon: LayoutDashboard },
  { name: 'Speech Evaluator',   path: '/practice/speaking',           icon: Mic             },
  { name: 'Pronunciation Coach',path: '/practice/pronunciation',      icon: Volume2         },
  { name: 'Vocabulary Builder', path: '/practice/vocabulary',         icon: BookOpen        },
  { name: 'Grammar Coach',      path: '/practice/grammar',            icon: Award           },
  { name: 'Reading Aloud',      path: '/practice/reading',            icon: BookOpenText    },
  { name: 'Listening Practice', path: '/practice/listening',          icon: Speech          },
  { name: 'Writing Assistant',  path: '/practice/writing',            icon: PenTool         },
  { name: 'Mock Interview',     path: '/practice/interview',          icon: Briefcase       },
  { name: 'GD Simulator',       path: '/practice/group-discussion',   icon: Users           },
];

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-white text-slate-900 flex flex-col border-r border-slate-200 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
          <Sparkles className="w-5 h-5 text-blue-400 fill-current" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">
          FluentAI
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-800'
              }`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Branding */}
      <div className="p-4 border-t border-slate-100 text-center">
        <span className="text-xs text-slate-400 font-medium">
          FluentAI • Personal Coach
        </span>
      </div>
    </aside>
  );
};
export default Sidebar;
