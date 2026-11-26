# Clinical OS (BD) — বাংলা ডকুমেন্টেশন সূচিপত্র

**উৎপাদন নাম:** Clinical OS (BD)  
**ট্যাগলাইন:** One Doctor. One Patient Record. Every Chamber.

এই ফোল্ডারে Clinical OS-এর মূল ডকুমেন্টগুলোর **মিশ্র বাংলা–ইংরেজি** অনুবাদ রয়েছে। টেবিল, কমান্ড, path, URL, port ইংরেজিতেই থাকে; প্রোডাক্ট/টেক শব্দ (API, PostgreSQL, offline, sync, chamber, prescription/Rx, BMDC, DGDA ইত্যাদি) যেখানে সুবিধাজনক সেখানে ইংরেজি রাখা হয়েছে।

## ডকুমেন্ট তালিকা

| # | ফাইল | ইংরেজি উৎস | বিষয় |
|---|---|---|---|
| 1 | [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) | [`DEVELOPMENT_PLAN.md`](../../DEVELOPMENT_PLAN.md) | প্রোডাক্ট SDP — ভিশন, roadmap, stack, backlog |
| 2 | [`WORKFLOW.md`](./WORKFLOW.md) | [`docs/WORKFLOW.md`](../WORKFLOW.md) | ক্লিনিকাল ও অপারেশনাল workflow — ভিজিট লাইফসাইকেল, RBAC, offline/sync |
| 3 | [`USAGE_GUIDE.md`](./USAGE_GUIDE.md) | [`docs/USAGE_GUIDE.md`](../USAGE_GUIDE.md) | রোল অনুযায়ী দৈনন্দিন ব্যবহার — doctor, assistant, patient, pharmacist, admin |
| 4 | [`DEVELOPER.md`](./DEVELOPER.md) | [`docs/DEVELOPER.md`](../DEVELOPER.md) | Developer handbook — repo layout, module, DB, IPC, commands |
| 5 | [`SCALE.md`](./SCALE.md) | [`docs/SCALE.md`](../SCALE.md) | Scale ও load-balance readiness (200k+ users) |

## দ্রুত লিংক (ইংরেজি)

- [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md) — native PostgreSQL সেটআপ (Docker optional)
- [`docs/BRANCHING.md`](../BRANCHING.md) — Git branch ও panel slice
- [`apps/web-assistant/`](../../apps/web-assistant/) — assistant/reception panel foundation

**ডিফল্ট runtime:** লোকাল **native PostgreSQL**; Docker শুধু optional scale lab-এর জন্য।