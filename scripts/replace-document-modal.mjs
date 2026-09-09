import fs from "node:fs";
const path = "/home/ubuntu/credwise-ai/client/src/pages/Home.tsx";
let text = fs.readFileSync(path, "utf8");
if (!text.includes('import DocumentReview from "@/components/DocumentReview";')) {
  text = text.replace('import { trpc } from "@/lib/trpc";', 'import { trpc } from "@/lib/trpc";\nimport DocumentReview from "@/components/DocumentReview";');
}
const start = text.indexOf("    {showDocument && <div className=\"modal-backdrop\"");
const end = text.indexOf("\n  </div>;", start);
if (start < 0 || end < 0) throw new Error("document modal boundary not found");
text = text.slice(0, start) + "    {showDocument && <DocumentReview onClose={() => setShowDocument(false)} />}" + text.slice(end);
fs.writeFileSync(path, text);
console.log("Replaced document modal with DocumentReview workspace");
