import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
          <Icon className="w-7 h-7 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-1">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      </div>
      {action}
    </div>
  );
}