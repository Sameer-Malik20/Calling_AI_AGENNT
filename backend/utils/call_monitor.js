// call_monitor.js
class CallMonitor {
    constructor(id) {
        this.id = id;
        this.startTime = Date.now();
        this.markers = [];
        console.log(`\n--- [MONITOR START] Call ID: ${id} ---`);
    }

    log(event) {
        const now = Date.now();
        const diff = now - this.startTime;
        this.markers.push({ event, time: diff });
        console.log(`[${diff}ms] ⏱️  ${event}`);
    }

    getSummary() {
        console.log(`\n--- [FINAL REPORT] ---`);
        this.markers.forEach(m => console.log(`${m.time}ms: ${m.event}`));
        console.log(`----------------------\n`);
    }
}

module.exports = CallMonitor;