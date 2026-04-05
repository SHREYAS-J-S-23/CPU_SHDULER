import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function CheatSheet() {
  return (
    <div className="glass-card rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">📘 Project Cheatsheet</h3>
      <Accordion type="multiple" className="text-sm">
        <AccordionItem value="dvfs">
          <AccordionTrigger className="text-xs font-semibold">DVFS Frequency Map</AccordionTrigger>
          <AccordionContent className="font-mono text-xs space-y-1">
            <p><span className="text-energy-blue">search</span> → 0.60 (lightest, CPU barely needed)</p>
            <p><span className="text-primary">io</span> → 0.50 (I/O bound, CPU mostly idle)</p>
            <p><span className="text-energy-amber">sort</span> → 0.80 (medium compute)</p>
            <p><span className="text-energy-red">matrix</span> → 1.00 (full CPU required)</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="energy">
          <AccordionTrigger className="text-xs font-semibold">Energy Model Formulas</AccordionTrigger>
          <AccordionContent className="font-mono text-xs space-y-1">
            <p>dynamic_power = BASE_POWER × frequency²</p>
            <p>static_power = 0.1 × BASE_POWER</p>
            <p>total_power = dynamic + static</p>
            <p>energy (J) = total_power × (burst / 1000)</p>
            <p>DVFS savings = (1 − actual/max) × 100%</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="score">
          <AccordionTrigger className="text-xs font-semibold">Energy Score Formula</AccordionTrigger>
          <AccordionContent className="font-mono text-xs">
            <p>Score = 0.35 × DVFS_savings%</p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.30 × utilization%</p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.20 × (1 − norm_waiting)</p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.15 × (1 − norm_energy)</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="algos">
          <AccordionTrigger className="text-xs font-semibold">Algorithm Summary</AccordionTrigger>
          <AccordionContent className="text-xs space-y-2">
            <p><strong>FCFS:</strong> Processes run in arrival order. Simple, no optimization. Frequency = 1.0.</p>
            <p><strong>SJF:</strong> Shortest burst first among available. Non-preemptive. Frequency = 1.0.</p>
            <p><strong>Priority:</strong> Lowest priority number = highest priority. Tie-break by arrival. Frequency = 1.0.</p>
            <p><strong>Round Robin:</strong> Time quantum slicing (default 4ms). Fair but high context switches. Frequency = 1.0.</p>
            <p><strong>Energy-Efficient:</strong> Sorts by energy_weight (burst × freq × power). Uses DVFS frequencies. Power ∝ freq². Your USP — lowest energy.</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="params">
          <AccordionTrigger className="text-xs font-semibold">4 Key Parameters</AccordionTrigger>
          <AccordionContent className="text-xs space-y-1">
            <p>1. <strong>CPU Power (W)</strong> — avg power across processes</p>
            <p>2. <strong>Execution Time (ms)</strong> — total makespan</p>
            <p>3. <strong>CPU Utilization (%)</strong> — busy time / total time</p>
            <p>4. <strong>DVFS Effectiveness (%)</strong> — energy saved vs 100% freq</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="sdg">
          <AccordionTrigger className="text-xs font-semibold">SDG-7 Connection</AccordionTrigger>
          <AccordionContent className="text-xs">
            <p>SDG-7: Affordable and Clean Energy. This project demonstrates intelligent scheduling can reduce computing energy consumption by ~35% without sacrificing performance, directly supporting sustainable computing goals.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
