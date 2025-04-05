
interface OrderNotesProps {
  notes: string | null | undefined;
}

export function OrderNotes({ notes }: OrderNotesProps) {
  if (!notes) return null;
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Notes</h3>
      <p className="text-muted-foreground">{notes}</p>
    </div>
  );
}
