// Card back symbols (63×88), following the product photo.
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const f = n => +n.toFixed(2);
const spark = (x, y, s, cls = 'cb-sp') => `<path class="${cls}" d="M${x} ${f(y-s)}Q${f(x+s*.13)} ${f(y-s*.13)} ${f(x+s)} ${y}Q${f(x+s*.13)} ${f(y+s*.13)} ${x} ${f(y+s)}Q${f(x-s*.13)} ${f(y+s*.13)} ${f(x-s)} ${y}Q${f(x-s*.13)} ${f(y-s*.13)} ${x} ${f(y-s)}Z"/>`;
const dots = (n, box, rmin, rmax, avoid = () => false) => { let o = ''; let k = 0;
  while (k < n) { const x = box[0] + rnd()*(box[2]-box[0]), y = box[1] + rnd()*(box[3]-box[1]); if (avoid(x,y)) continue;
    o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rmin + rnd()*(rmax-rmin))}"/>`; k++; } return o; };
const poly = pts => `<polyline class="cb-ln" points="${pts.map(p=>p.join(',')).join(' ')}"/>`;
const stars = (pts, r) => pts.map(([x,y]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
const label = y => (x, yy) => yy > 70; // keep label zone clear
const noLabel = (x, y) => y > 69;

// I · Първите моменти — sparse, navy art on nude
const dip = [[15,47],[21,44],[26,42],[31,37],[37,33],[41,28]];
const s1 = `<symbol id="cb-s1" viewBox="0 0 63 88">
<g class="cb-dots">${dots(22,[6,6,57,66],.18,.42,noLabel)}</g>
${poly(dip)}${poly([[37,33],[41,35]])}
<g class="cb-st">${stars(dip,.75)}<circle cx="41" cy="35" r=".55"/></g>
${spark(13,17,2.6)}${spark(46,45,3.4)}${spark(52,13,1.3)}${spark(9,58,1.1)}
</symbol>`;

// II · Какво се промени — dense gold network on navy
const net = [[11,26],[17,20],[24,27],[29,21],[34,25],[22,35],[30,38],[36,33],[42,40],[48,35],[52,45],[45,51],[37,47],[28,49],[18,44]];
const s2 = `<symbol id="cb-s2" viewBox="0 0 63 88">
<g class="cb-dots">${dots(70,[4,4,59,66],.12,.42,noLabel)}</g>
${poly([net[0],net[1],net[2],net[3],net[4]])}${poly([net[2],net[5],net[6],net[7],net[4]])}${poly([net[6],net[8],net[9]])}${poly([net[8],net[10],net[11],net[12],net[6]])}${poly([net[12],net[13],net[14],net[5]])}
<g class="cb-st">${stars(net,.55)}</g>
<g class="cb-glow">${spark(17,20,2.4)}${spark(30,38,2.8)}${spark(42,40,2.2)}${spark(52,45,2.6)}${spark(24,27,1.6)}${spark(45,13,1.8)}${spark(9,50,1.4)}${spark(56,24,1.3)}</g>
</symbol>`;

// III · Какво искаме да запазим — gold constellations + light thread on wine
const lc = [[8,22],[13,18],[19,23],[16,30],[23,34],[28,29]];
const rc = [[40,50],[46,47],[52,52],[49,58],[56,60],[43,57]];
const s3 = `<symbol id="cb-s3" viewBox="0 0 63 88">
<g class="cb-dots">${dots(55,[4,4,59,66],.12,.4,noLabel)}</g>
${poly(lc)}${poly([lc[2],[24,18]])}${poly(rc)}${poly([rc[1],[47,41]])}
<g class="cb-st">${stars(lc,.55)}${stars(rc,.55)}<circle cx="24" cy="18" r=".45"/><circle cx="47" cy="41" r=".45"/></g>
<path class="cb-thread" d="M40 3C34 12 45 21 38 31C34.5 36 34 40 36 42.5C39.5 46 46 52 43.5 66"/>
<circle class="cb-halo" cx="36" cy="42.5" r="7"/>
<g class="cb-glow">${spark(36,42.5,3.6,'cb-sp cb-core')}${spark(14,62,2.2)}${spark(52,30,1.6)}${spark(10,40,1.2)}${spark(56,10,1.4)}</g>
</symbol>`;

// Специални карти — шампанско със златни детайли
const sp = `<symbol id="cb-sp" viewBox="0 0 63 88">
<rect class="cb-frame" x="4" y="4" width="55" height="80" rx="3"/>
<rect class="cb-frame cb-frame--thin" x="6" y="6" width="51" height="76" rx="2.2"/>
<path class="cb-thread" d="M17 40C23 40 27 32 31.5 32C36 32 40 40 46 40"/>
<g class="cb-st"><circle cx="17" cy="40" r=".7"/><circle cx="46" cy="40" r=".7"/></g>
${spark(31.5,32,3)}${spark(11,11,1.3)}${spark(52,11,1.3)}
</symbol>`;
process.stdout.write([s1,s2,s3,sp].join('\n'));
