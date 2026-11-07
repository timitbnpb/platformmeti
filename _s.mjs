import {chromium,devices} from "/opt/homebrew/lib/node_modules/@playwright/cli/node_modules/playwright-core/index.mjs";
const b=await chromium.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"});
for(const [n,o] of [["d",{viewport:{width:1440,height:900}}],["m",{...devices["iPhone 13"],viewport:{width:390,height:844}}]]){
 const c=await b.newContext(o);const p=await c.newPage();
 await p.goto("http://localhost:8822/galeri.html#foto");await p.waitForTimeout(2500);
 await p.locator(".gal-mosaik").scrollIntoViewIfNeeded();await p.waitForTimeout(1500);
 await p.screenshot({path:`/tmp/g-${n}.png`});
}
await b.close();
