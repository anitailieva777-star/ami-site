// Generates the constellation SVG (two profiles + thread). Run: node sky.mjs
const L = { // man, facing right
  face: [[64,40],[92,26],[122,34],[138,56],[141,74],[139,82],[143,88],[154,102],[145,108],[149,115],[144,120],[148,126],[143,138],[127,147],[122,162],[120,186]],
  back: [[64,40],[54,66],[58,96],[70,120],[84,140],[82,186]],
  inner: [[[90,96],[120,100],[128,82]],[[90,96],[104,132],[127,147]]],
  bright: [[128,82],[92,26],[154,102]],
};
const R = { // woman, facing left, longer hair
  face: [[268,24],[240,32],[223,54],[219,72],[221,82],[217,89],[208,101],[215,107],[212,114],[216,119],[212,125],[217,136],[232,146],[238,162],[240,186]],
  back: [[268,24],[296,36],[312,58],[318,88],[326,118],[320,148],[332,176],[322,204]],
  inner: [[[300,70],[306,110],[298,150],[306,192]],[[232,82],[242,100],[270,96],[300,70]]],
  bright: [[232,82],[312,58],[208,101],[326,118]],
  hairLines: true,
};
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const field = [];
while (field.length < 34) { const x = 8 + rnd()*344, y = 6 + rnd()*200;
  if (x > 40 && x < 340 && y > 15 && y < 195 && !(x>150 && x<210)) { if (rnd() < .75) continue; }
  field.push([+x.toFixed(1), +y.toFixed(1), +(0.5 + rnd()*0.9).toFixed(2)]); }
const pts = a => a.map(p => p.join(',')).join(' ');
const key = p => p.join(',');
function profile(P, id) {
  const lines = [P.face, ...(P.hairLines?[P.back, P.inner[0]]:[])].map(a => `<polyline class="ln" pathLength="1" points="${pts(a)}"/>`).join('');
  const seen = new Set(); const stars = [];
  for (const a of [P.face, P.back, ...P.inner]) for (const p of a) { if (seen.has(key(p))) continue; seen.add(key(p));
    const b = P.bright.some(q => key(q) === key(p)); stars.push(`<circle class="st${b?' st--b':''}" cx="${p[0]}" cy="${p[1]}" r="${b?2.1:1.35}"/>`); }
  return `<g class="sky-${id}"><g class="lns">${lines}</g><g class="sts">${stars.join('')}</g></g>`;
}
const spark = (x,y,s,c) => `<path class="sp${c?' '+c:''}" d="M${x} ${y-s}Q${x+s*.12} ${y-s*.12} ${x+s} ${y}Q${x+s*.12} ${y+s*.12} ${x} ${y+s}Q${x-s*.12} ${y+s*.12} ${x-s} ${y}Q${x-s*.12} ${y-s*.12} ${x} ${y-s}Z"/>`;
const fieldSvg = field.map(([x,y,r]) => `<circle class="fs" cx="${x}" cy="${y}" r="${r}"/>`).join('') + spark(36,30,5) + spark(338,150,4) + spark(18,160,3.5) + spark(300,16,3);
const thread = `<path class="thread" pathLength="1" d="M126 170C150 170 164 140 180 140C196 140 212 176 238 178"/>`;
const core = `<g class="core"><circle class="glow" cx="180" cy="140" r="22"/>${spark(180,140,9,'core-sp')}<circle class="core-dot" cx="180" cy="140" r="2.6"/></g><circle class="st st--b" cx="126" cy="170" r="2.1"/><circle class="st st--b" cx="238" cy="178" r="2.1"/>`;
const body = `<g class="field">${fieldSvg}</g>${profile(L,'l')}${profile(R,'r')}${thread}${core}`;
process.stdout.write(body);
