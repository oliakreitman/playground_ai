'use client';

import { useState } from 'react';
import { NotesSection } from '@/components/data-sections/NotesSection';
import { TodoSection } from '@/components/data-sections/TodoSection';
import { FilesSection } from '@/components/data-sections/FilesSection';

type Section = 'notes' | 'todos' | 'files';

export function DataManager() {
  const [activeSection, setActiveSection] = useState<Section>('notes');

  const sections = [
    { 
      id: 'notes' as Section, 
      label: '📝 Notes', 
      description: 'Write and record voice notes',
      color: 'blue'
    },
    { 
      id: 'todos' as Section, 
      label: '✅ Todo List', 
      description: 'Manage your tasks and deadlines',
      color: 'green'
    },
    { 
      id: 'files' as Section, 
      label: '📁 Files', 
      description: 'Upload and organize your files',
      color: 'purple'
    },
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive 
        ? 'bg-blue-600 text-white shadow-lg' 
        : 'text-blue-600 hover:bg-blue-50 border-blue-200',
      green: isActive 
        ? 'bg-green-600 text-white shadow-lg' 
        : 'text-green-600 hover:bg-green-50 border-green-200',
      purple: isActive 
        ? 'bg-purple-600 text-white shadow-lg' 
        : 'text-purple-600 hover:bg-purple-50 border-purple-200',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getSectionComponent = () => {
    switch (activeSection) {
      case 'notes':
        return <NotesSection />;
      case 'todos':
        return <TodoSection />;
      case 'files':
        return <FilesSection />;
      default:
        return <NotesSection />;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">📊 Data Manager</h2>
        <p className="text-gray-600">Organize your digital life in one place</p>
      </div>

      {/* Section Navigation */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                getColorClasses(section.color, activeSection === section.id)
              }`}
            >
              <div className="text-2xl mb-3">{section.label}</div>
              <p className={`text-sm ${
                activeSection === section.id ? 'text-white opacity-90' : 'text-gray-600'
              }`}>
                {section.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Active Section Content */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {getSectionComponent()}
      </div>
    </div>
  );
}