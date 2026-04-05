import { Process, TaskType, DVFS_MAP } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { DEFAULT_PROCESSES } from "@/lib/types";

interface ProcessTableProps {
  processes: Process[];
  onChange: (processes: Process[]) => void;
}

export function ProcessTable({ processes, onChange }: ProcessTableProps) {
  const addProcess = () => {
    const pid = `P${processes.length + 1}`;
    onChange([...processes, { pid, name: "New Task", burstTime: 3, arrivalTime: 0, priority: 3, taskType: "sort", frequency: 0.8 }]);
  };

  const removeProcess = (index: number) => {
    onChange(processes.filter((_, i) => i !== index));
  };

  const updateProcess = (index: number, field: keyof Process, value: string | number) => {
    const updated = [...processes];
    const p = { ...updated[index] };
    if (field === "taskType") {
      p.taskType = value as TaskType;
      p.frequency = DVFS_MAP[value as TaskType];
    } else if (field === "name") {
      p.name = value as string;
    } else {
      (p as any)[field] = Number(value);
    }
    updated[index] = p;
    onChange(updated);
  };

  return (
    <div className="glass-card rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Process Queue</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onChange(DEFAULT_PROCESSES)}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={addProcess}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 font-medium text-muted-foreground">PID</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Burst</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Arrival</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Priority</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Type</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Freq</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p, i) => (
              <tr key={p.pid} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="p-2 font-mono font-medium text-primary">{p.pid}</td>
                <td className="p-2">
                  <Input className="h-7 text-xs w-28" value={p.name} onChange={e => updateProcess(i, "name", e.target.value)} />
                </td>
                <td className="p-2">
                  <Input className="h-7 text-xs w-16" type="number" min={1} value={p.burstTime} onChange={e => updateProcess(i, "burstTime", e.target.value)} />
                </td>
                <td className="p-2">
                  <Input className="h-7 text-xs w-16" type="number" min={0} value={p.arrivalTime} onChange={e => updateProcess(i, "arrivalTime", e.target.value)} />
                </td>
                <td className="p-2">
                  <Input className="h-7 text-xs w-16" type="number" min={1} max={5} value={p.priority} onChange={e => updateProcess(i, "priority", e.target.value)} />
                </td>
                <td className="p-2">
                  <Select value={p.taskType} onValueChange={v => updateProcess(i, "taskType", v)}>
                    <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="search">Search</SelectItem>
                      <SelectItem value="sort">Sort</SelectItem>
                      <SelectItem value="matrix">Matrix</SelectItem>
                      <SelectItem value="io">I/O</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2 font-mono text-xs text-muted-foreground">{p.frequency.toFixed(1)}</td>
                <td className="p-2">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeProcess(i)} disabled={processes.length <= 1}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
