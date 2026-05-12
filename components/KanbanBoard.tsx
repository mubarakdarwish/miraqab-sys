
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Consignment, WorkflowStep, ConsignmentDirection } from '../types';

interface KanbanBoardProps {
  consignments: Consignment[];
  onUpdateStatus: (id: string, newStep: WorkflowStep) => void;
  onCardClick: (consignment: Consignment) => void;
}

// Columns definition mapping to WorkflowStep
const COLUMNS: { id: WorkflowStep; title: string; color: string; icon: string }[] = [
  { id: WorkflowStep.ARRIVAL, title: 'الوصول / التسجيل', color: 'border-slate-300', icon: 'fa-ship' },
  { id: WorkflowStep.INSPECTION, title: 'المعاينة والفحص', color: 'border-blue-300', icon: 'fa-search' },
  { id: WorkflowStep.LAB_RESULT, title: 'المختبر والعينات', color: 'border-amber-300', icon: 'fa-vial' },
  { id: WorkflowStep.FINAL_STATUS, title: 'القرار النهائي', color: 'border-green-300', icon: 'fa-gavel' },
];

const safeFormatDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return '---';
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? '---' : date.toLocaleDateString('en-GB');
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ consignments, onUpdateStatus, onCardClick }) => {
  const [columns, setColumns] = useState<Record<WorkflowStep, Consignment[]>>({
    [WorkflowStep.ARRIVAL]: [],
    [WorkflowStep.INSPECTION]: [],
    [WorkflowStep.DECISION]: [], // Not used as a column but needed for type safety
    [WorkflowStep.LAB_RESULT]: [],
    [WorkflowStep.FINAL_STATUS]: [],
  });

  // Function to categorize consignments into columns based on logic if currentStep isn't set
  const categorizeConsignment = (c: Consignment): WorkflowStep => {
      if (c.currentStep) return c.currentStep;
      
      // Legacy Logic inference
      if (c.status === 'Approved' || c.status === 'Rejected' || c.technicalAction === 'إفراج نهائي') return WorkflowStep.FINAL_STATUS;
      if (c.hasSample && c.inspectionResult === 'قيد الفحص') return WorkflowStep.LAB_RESULT;
      if (c.inspectionResult === 'قيد الفحص') return WorkflowStep.INSPECTION;
      
      return WorkflowStep.ARRIVAL;
  };

  useEffect(() => {
    const newCols: Record<WorkflowStep, Consignment[]> = {
        [WorkflowStep.ARRIVAL]: [],
        [WorkflowStep.INSPECTION]: [],
        [WorkflowStep.DECISION]: [],
        [WorkflowStep.LAB_RESULT]: [],
        [WorkflowStep.FINAL_STATUS]: [],
    };

    consignments.forEach(c => {
        const step = categorizeConsignment(c);
        if (newCols[step]) {
            newCols[step].push(c);
        } else {
            // Fallback for DECISION or unknown
            newCols[WorkflowStep.FINAL_STATUS].push(c);
        }
    });

    setColumns(newCols);
  }, [consignments]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside
    if (!destination) return;

    // Dropped in same place
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColId = source.droppableId as WorkflowStep;
    const destColId = destination.droppableId as WorkflowStep;

    // Optimistic Update
    const sourceItems = [...columns[sourceColId]];
    const destItems = [...columns[destColId]];
    const [removed] = sourceItems.splice(source.index, 1);
    destItems.splice(destination.index, 0, { ...removed, currentStep: destColId });

    setColumns({
      ...columns,
      [sourceColId]: sourceItems,
      [destColId]: destItems,
    });

    // Notify Parent to save to DB
    onUpdateStatus(draggableId, destColId);
  };

  return (
    <div className="h-full overflow-x-auto overflow-y-hidden pb-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 min-w-[1000px] h-full items-stretch">
          {COLUMNS.map((col) => (
            <div key={col.id} className="flex-1 min-w-[280px] flex flex-col bg-slate-50/50 rounded-[2rem] border border-slate-200 shadow-sm max-h-[700px]">
              {/* Column Header */}
              <div className={`p-4 border-b-4 ${col.color} bg-white rounded-t-[2rem] flex justify-between items-center sticky top-0 z-10`}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        <i className={`fas ${col.icon}`}></i>
                    </div>
                    <h3 className="font-black text-slate-800 text-sm">{col.title}</h3>
                </div>
                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold">
                  {columns[col.id]?.length || 0}
                </span>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 p-3 overflow-y-auto custom-scrollbar space-y-3 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {columns[col.id]?.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onCardClick(item)}
                            className={`bg-white p-4 rounded-2xl border shadow-sm cursor-grab active:cursor-grabbing group hover:shadow-md transition-all relative overflow-hidden ${
                                snapshot.isDragging ? 'shadow-xl rotate-2 ring-2 ring-blue-500 z-50' : 
                                item.riskScore > 60 ? 'border-red-200 bg-red-50/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-100'
                            }`}
                            style={{ ...provided.draggableProps.style }}
                          >
                            {/* Risk Strip */}
                            <div className={`absolute top-0 right-0 bottom-0 w-1.5 ${item.riskScore > 60 ? 'bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]' : item.riskScore > 30 ? 'bg-amber-400' : 'bg-green-400'}`}></div>
                            
                            <div className="pl-2">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded w-fit">
                                                {item.direction === ConsignmentDirection.OUTBOUND ? item.id : (item.bayanNumber || '---')}
                                            </span>
                                            {item.riskScore > 60 && <span className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse shadow-sm">مخاطر عالية</span>}
                                        </div>
                                        {item.permitNumber && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded w-fit">تصريح: {item.permitNumber}</span>}
                                    </div>
                                    {item.isLocked && <i className="fas fa-lock text-[10px] text-red-400"></i>}
                                </div>
                                <h4 className="font-bold text-slate-800 text-xs mb-1 line-clamp-2">{item.importer}</h4>
                                <p className="text-[10px] text-slate-500 mb-2 truncate">{item.items?.[0]?.description || 'منتجات عامة'}</p>
                                
                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                                    <div className="flex gap-2">
                                        {item.hasSample && <i className="fas fa-vial text-[10px] text-blue-500 bg-blue-50 p-1 rounded" title="يوجد عينة"></i>}
                                        {item.hasUndertaking && <i className="fas fa-file-contract text-[10px] text-amber-500 bg-amber-50 p-1 rounded" title="يوجد تعهد"></i>}
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-mono">{safeFormatDate(item.createdAt)}</span>
                                </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};
