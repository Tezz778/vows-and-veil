import { Droppable } from '@hello-pangea/dnd';
import GuestChip from './GuestChip';
import { Trash2 } from 'lucide-react';

export default function TableCard({ table, guests, onDelete }) {
  const atCapacity = guests.length >= (table.capacity || 8);

  return (
    <div className="elegant-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <h3 className="serif-heading text-lg text-foreground truncate">{table.name}</h3>
          <p className={`text-xs mt-0.5 ${atCapacity ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            {guests.length} / {table.capacity || 8} seated
          </p>
        </div>
        <button
          onClick={onDelete}
          aria-label={`Delete ${table.name}`}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <Droppable droppableId={table.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[72px] space-y-2 rounded-xl p-2 transition-colors ${
              snapshot.isDraggingOver ? 'bg-accent/60' : 'bg-secondary/20'
            }`}
          >
            {guests.map((guest, index) => (
              <GuestChip key={guest.id} guest={guest} index={index} />
            ))}
            {provided.placeholder}
            {guests.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-xs text-muted-foreground/40 text-center py-3 select-none">Drag guests here</p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}