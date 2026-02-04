# Telnyx Migration Report (Hinglish)

Bhai, ye report hai jisme bataya gaya hai ki abhi local SIP use ho raha hai aur jab Telnyx pe shift karoge to kaha-kaha changes karne honge.

## 1. Backend Changes (SIP Config)

**File Path:** `backend/call/freeswitch_handler.js`
**Line Numbers:** 20-24, 214-221

Abhi yahan local configuration hai. Telnyx ke liye ye changes karne honge:

- **Line 21:** `name: process.env.DIAL_PROVIDER || 'local'` ko change karke `.env` file me `DIAL_PROVIDER=telnyx` likhna hoga.
- **Line 22:** `sender` me apna purchased Telnyx number dalna hoga (`SENDER_ID`).
- **Line 23:** `domain` me Telnyx ka SIP domain dalna hoga (`sip.telnyx.com`).
- **Line 214:** `if (this.provider.name === 'telnyx')` wala block active ho jayega. Bas dhyan rakhna ki FreeSWITCH ke `conf/sip_profiles/external/` me aek `telnyx.xml` gateway file bani ho.

## 2. Environment Variables (.env)

**File Path:** `backend/.env`

Jab Telnyx use karoge, to ye variables update karne honge:
```env
DIAL_PROVIDER=telnyx
SENDER_ID=+1XXXXXXXXXX (Apna Telnyx Number)
SIP_DOMAIN=sip.telnyx.com
```

## 3. UI/Dashboard Duration Fixes (Completed)

Dashboard aur Analytics (System Impact) me duration ab sahi display hogi. 
- Agar duration 60 seconds se kam hai, to vo **seconds (s)** me dikhayega.
- Agar 60 seconds se zyada hai, to vo **minutes (m)** me dikhayega.
- `NaN` values ka issue bhi solve kar diya gaya hai (vo `0s` dikhayega agar data nahi hai).

## Summary Table

| Requirement | File | Action |
|-------------|------|--------|
| Provider Name | `freeswitch_handler.js` (Line 21) | Change `local` to `telnyx` in `.env` |
| Caller ID | `freeswitch_handler.js` (Line 22) | Use Telnyx number |
| SIP Domain | `freeswitch_handler.js` (Line 23) | Set to `sip.telnyx.com` |
| Routing Logic | `freeswitch_handler.js` (Line 214-221) | Conditional logic ready for Telnyx gateway |

Aap bas `.env` me provider aur number change karke Telnyx testing start kar sakte ho.
