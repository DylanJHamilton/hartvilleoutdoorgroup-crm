// Pure, deterministic builder for pipeline columns and cards (no Angular deps)
import { makeSeed } from '../shared/demo/seed.util';

export type PipelineStage = 'Lead'|'Qualified'|'Quoted'|'Verbal Yes'|'Won'|'Lost';

export interface PipelineCard {
  id: number;
  title: string;
  customer: string;
  pipeline: string;   // e.g., 'Sheds', 'Golf Carts'
  stage: PipelineStage;
  status: 'Open'|'Stalled'|'Won'|'Lost';
  value: number;
  owner: string;
  age: number;        // days in stage
}

export interface BuildArgs {
  storeId: string;
  profileId: string;
  timeframe: string;
  tick: number;
  base: number;       // base count used to scale volume
}

export function buildPipeline(args: BuildArgs) {
  const { storeId, profileId, timeframe, tick, base } = args;
  const seedKey = `${storeId}|${profileId}|${timeframe}|PIPELINE_BUILDER|${tick}`;
  const r = makeSeed(seedKey);

  const stages: PipelineStage[] = ['Lead','Qualified','Quoted','Verbal Yes','Won','Lost'];
  const owners = ['Sam Sales','Taylor Kim','Riley Singh','Morgan Diaz'];
  const pipes  = ['Sheds','Barns','Cabins','Furniture','Swing Sets','Trampolines','Playgrounds','Golf Carts','E-Bikes'];
  const titles = ['12x16 Barn Shed','Evolution D5 Maverick 4','Forester 6','Dash Elite 48V','Denago Rover S','Poly Playset','12x24 Cabin'];

  // distribute counts by stage shape
  const totals = shapeCounts(base, r);
  const cols = stages.map((stage, idx) => ({
    stage,
    cards: [] as PipelineCard[],
    count: totals[idx]
  }));

  let id = 5000 + Math.floor(r()*1000);
  for (const col of cols) {
    for (let i=0;i<col.count;i++){
      const owner = pick(owners, r);
      const pipeline = pick(pipes, r);
      const title = pick(titles, r);
      const customer = `${pickFirst(r)} ${pickLast(r)}`;
      const value = pickValue(title);
      const isClosed = col.stage === 'Won' || col.stage === 'Lost';
      const status: 'Open'|'Stalled'|'Won'|'Lost' = isClosed ? (col.stage as any) : (r() > 0.85 ? 'Stalled' : 'Open');
      const age = Math.max(0, Math.round(r()*20 + (i%7)));
      col.cards.push({ id:id++, title, customer, pipeline, stage: col.stage, status, value, owner, age });
    }
  }

  return cols;
}

function shapeCounts(base: number, r: () => number) {
  // lead-heavy, tapering funnel; wobble keeps per-store uniqueness
  const wob = () => 0.85 + r()*0.3; // 0.85..1.15
  const lead = Math.round(base * wob());
  const qual = Math.round(lead * (0.65 * wob()));
  const qted = Math.round(qual * (0.70 * wob()));
  const verb = Math.round(qted * (0.65 * wob()));
  const won  = Math.max(1, Math.round(verb * (0.55 * wob())));
  const lost = Math.max(1, Math.round(qted * (0.25 * wob())));
  return [lead, qual, qted, verb, won, lost];
}

function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r()*arr.length)];
}
function pickFirst(r: () => number){ const n = ['Alex','Bailey','Casey','Drew','Elliot','Finley','Gray','Harper','Indy','Jules','Kai','Logan','Milan','Nico','Oakley','Parker','Quinn','Reese','Shay','Taylor']; return pick(n, r); }
function pickLast(r: () => number){ const n = ['Adams','Brooks','Carter','Diaz','Evans','Foster','Garcia','Hayes','Ibarra','Jones','Kim','Lopez','Nguyen','Ortiz','Patel','Quinn','Reed','Shah','Tran','Young']; return pick(n, r); }
function pickValue(t: string){
  if (t.includes('Forester')) return 12995;
  if (t.includes('Maverick') || t.includes('Denago')) return 8995;
  if (t.includes('Dash Elite')) return 7995;
  if (t.includes('Barn Shed')) return 4899;
  if (t.includes('Cabin')) return 14999;
  return 299;
}
