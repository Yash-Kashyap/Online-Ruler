export type Unit = 'cm' | 'in' | 'px';
export type Edge = 'top' | 'bottom' | 'left' | 'right';

export interface Guideline {
  id: string;
  x: number;
  y: number;
}

interface State {
  ppi: number;
  unit: Unit;
  activeEdges: Set<Edge>;
  guidelines: Guideline[];
  showGuidelines: boolean;
  showCrosshair: boolean;
}

type Listener = (state: State) => void;

class RulerStore {
  private state: State = {
    ppi: 96,
    unit: 'cm',
    activeEdges: new Set(['top']),
    guidelines: [],
    showGuidelines: true,
    showCrosshair: false
  };
  private listeners: Set<Listener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ruler_state');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.ppi) this.state.ppi = parsed.ppi;
          if (parsed.unit) this.state.unit = parsed.unit;
          if (parsed.activeEdges) this.state.activeEdges = new Set(parsed.activeEdges);
          if (parsed.guidelines) this.state.guidelines = parsed.guidelines;
          if (parsed.showGuidelines !== undefined) this.state.showGuidelines = parsed.showGuidelines;
          if (parsed.showCrosshair !== undefined) this.state.showCrosshair = parsed.showCrosshair;
        } catch (e) {}
      }
    }
  }

  getState() {
    return this.state;
  }

  setState(partial: Partial<Omit<State, 'activeEdges'>> | { activeEdges?: Edge[] }) {
    const nextState = { ...this.state };
    if (partial.ppi !== undefined) nextState.ppi = partial.ppi;
    if (partial.unit !== undefined) nextState.unit = partial.unit as Unit;
    if (partial.guidelines !== undefined) nextState.guidelines = partial.guidelines;
    if (partial.showGuidelines !== undefined) nextState.showGuidelines = partial.showGuidelines;
    if (partial.showCrosshair !== undefined) nextState.showCrosshair = partial.showCrosshair;
    
    if (partial.activeEdges !== undefined) {
      nextState.activeEdges = new Set(partial.activeEdges);
    }
    
    this.state = nextState;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ruler_state', JSON.stringify({
        ppi: this.state.ppi,
        unit: this.state.unit,
        activeEdges: Array.from(this.state.activeEdges),
        guidelines: this.state.guidelines,
        showGuidelines: this.state.showGuidelines,
        showCrosshair: this.state.showCrosshair
      }));
    }
    this.notify();
  }

  toggleEdge(edge: Edge) {
    const edges = new Set(this.state.activeEdges);
    if (edges.has(edge)) {
      edges.delete(edge);
    } else {
      edges.add(edge);
    }
    this.setState({ activeEdges: Array.from(edges) });
  }

  addGuideline(x: number, y: number) {
    const newGuideline = {
      id: Math.random().toString(36).substring(2, 9),
      x,
      y
    };
    this.setState({ guidelines: [...this.state.guidelines, newGuideline] });
  }

  removeGuideline(id: string) {
    this.setState({ guidelines: this.state.guidelines.filter(g => g.id !== id) });
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l(this.state));
  }
}

export const rulerStore = new RulerStore();
