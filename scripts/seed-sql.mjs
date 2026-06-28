// 시드 JSON → SQL (psql 직접 주입용). service_role 키 불필요.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const load = (f) => JSON.parse(readFileSync(join(process.cwd(), "data/seed", f), "utf8"));
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const j = (o) => "'" + JSON.stringify(o).replace(/'/g, "''") + "'::jsonb";

const industries = load("industries.json");
const obligations = load("obligations.json");
const hazards = load("hazard_seeds.json");

const out = [];
out.push("begin;");

out.push("-- industries");
for (const r of industries) {
  out.push(
    `insert into industries (code,name,sort_order) values (${q(r.code)},${q(r.name)},${r.sort_order})
     on conflict (code) do update set name=excluded.name, sort_order=excluded.sort_order;`
  );
}

out.push("-- obligations");
for (const o of obligations) {
  out.push(
    `insert into obligations (code,title,description,required_evidence,applies_to,sort_order)
     values (${q(o.code)},${q(o.title)},${q(o.description)},${q(o.required_evidence)},${j(o.applies_to)},${o.sort_order})
     on conflict (code) do update set title=excluded.title, description=excluded.description,
       required_evidence=excluded.required_evidence, applies_to=excluded.applies_to, sort_order=excluded.sort_order;`
  );
}

out.push("-- hazard_seeds (재삽입)");
out.push("delete from hazard_seeds;");
for (const h of hazards) {
  out.push(
    `insert into hazard_seeds (industry_code,process_keyword,hazard,default_measures)
     values (${q(h.industry_code)},${q(h.process_keyword)},${q(h.hazard)},${j(h.default_measures)});`
  );
}

out.push("commit;");
process.stdout.write(out.join("\n") + "\n");
