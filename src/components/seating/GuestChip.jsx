import { Draggable } from '@hello-pangea/dnd';

const RSVP_DOT = {
  yes: 'bg-emerald-500',
  no: 'bg-rose-400',
  pending: 'bg-muted-foreground/30',
};

export default function GuestChip({ guest, index }) {
  return (
    <Draggable draggableId={guest.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-grab active:cursor-grabbing transition-shadow ${
            snapshot.isDragging
              ? 'bg-primary text-primary-foreground border-primary shadow-lg'
              : 'bg-card border-border/70 hover:border-primary/40'
          }`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${RSVP_DOT[guest.rsvp_status] || RSVP_DOT.pending}`} />
          <span className="font-medium truncate flex-1">{guest.name}</span>
          {Number(guest.plus_ones) > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${snapshot.isDragging ? 'bg-primary-foreground/20' : 'bg-secondary'}`}>
              +{guest.plus_ones}
            </span>
          )}
        </div>
      )}
    </Draggable>
  );
}